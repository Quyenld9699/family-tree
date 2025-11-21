import { Injectable, NotFoundException, Inject, forwardRef, ConflictException } from '@nestjs/common';
import { CreateSpouseDto } from './dto/create-spouse.dto';
import { UpdateSpouseDto } from './dto/update-spouse.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Spouse } from './schemas/spouse.schema';
import { Model, Types } from 'mongoose';
import { ParentChildService } from '../parent-child/parent-child.service';

@Injectable()
export class SpouseService {
    constructor(
        @InjectModel(Spouse.name) private readonly spouseModel: Model<Spouse>,
        @Inject(forwardRef(() => ParentChildService))
        private readonly parentChildService: ParentChildService,
    ) {}

    async create(createSpouseDto: CreateSpouseDto) {
        // Validate husband order - check if this order already exists for this husband
        if (createSpouseDto.husbandOrder) {
            const existingHusbandOrder = await this.spouseModel
                .findOne({
                    husband: createSpouseDto.husband,
                    husbandOrder: createSpouseDto.husbandOrder,
                })
                .exec();

            if (existingHusbandOrder) {
                throw new ConflictException(`Husband already has a spouse with order ${createSpouseDto.husbandOrder}. Please choose a different order.`);
            }
        }

        // Validate wife order - check if this order already exists for this wife
        if (createSpouseDto.wifeOrder) {
            const existingWifeOrder = await this.spouseModel
                .findOne({
                    wife: createSpouseDto.wife,
                    wifeOrder: createSpouseDto.wifeOrder,
                })
                .exec();

            if (existingWifeOrder) {
                throw new ConflictException(`Wife already has a spouse with order ${createSpouseDto.wifeOrder}. Please choose a different order.`);
            }
        }

        const newSpouse = await this.spouseModel.create(createSpouseDto);
        return await newSpouse.populate(['husband', 'wife']);
    }

    async findAll() {
        return await this.spouseModel.find().populate(['husband', 'wife']).exec();
    }

    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid spouse relationship ID: ${id}`);
        }

        const spouse = await this.spouseModel.findById(id).populate(['husband', 'wife']).exec();

        if (!spouse) {
            throw new NotFoundException(`Spouse relationship with ID ${id} not found`);
        }

        return spouse;
    }

    async update(id: string, updateSpouseDto: UpdateSpouseDto) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid spouse relationship ID: ${id}`);
        }

        // Get current spouse record
        const currentSpouse = await this.spouseModel.findById(id).exec();
        if (!currentSpouse) {
            throw new NotFoundException(`Spouse relationship with ID ${id} not found`);
        }

        // Validate husband order if being updated
        if (updateSpouseDto.husbandOrder !== undefined && updateSpouseDto.husbandOrder !== currentSpouse.husbandOrder) {
            const existingHusbandOrder = await this.spouseModel
                .findOne({
                    husband: updateSpouseDto.husband || currentSpouse.husband,
                    husbandOrder: updateSpouseDto.husbandOrder,
                    _id: { $ne: id }, // Exclude current record
                })
                .exec();

            if (existingHusbandOrder) {
                throw new ConflictException(`Husband already has a spouse with order ${updateSpouseDto.husbandOrder}. Please choose a different order.`);
            }
        }

        // Validate wife order if being updated
        if (updateSpouseDto.wifeOrder !== undefined && updateSpouseDto.wifeOrder !== currentSpouse.wifeOrder) {
            const existingWifeOrder = await this.spouseModel
                .findOne({
                    wife: updateSpouseDto.wife || currentSpouse.wife,
                    wifeOrder: updateSpouseDto.wifeOrder,
                    _id: { $ne: id }, // Exclude current record
                })
                .exec();

            if (existingWifeOrder) {
                throw new ConflictException(`Wife already has a spouse with order ${updateSpouseDto.wifeOrder}. Please choose a different order.`);
            }
        }

        const updatedSpouse = await this.spouseModel.findByIdAndUpdate(id, updateSpouseDto, { new: true }).populate(['husband', 'wife']).exec();

        if (!updatedSpouse) {
            throw new NotFoundException(`Spouse relationship with ID ${id} not found`);
        }

        return updatedSpouse;
    }

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid spouse relationship ID: ${id}`);
        }

        const deletedSpouse = await this.spouseModel.findByIdAndDelete(id).exec();

        if (!deletedSpouse) {
            throw new NotFoundException(`Spouse relationship with ID ${id} not found`);
        }

        return { message: `Spouse relationship with ID ${id} has been successfully deleted` };
    }

    async findByPerson(personId: string) {
        if (!Types.ObjectId.isValid(personId)) {
            throw new NotFoundException(`Invalid person ID: ${personId}`);
        }

        const res1 = await this.spouseModel.find({ husband: personId }).populate(['wife']).exec();
        const res2 = await this.spouseModel.find({ wife: personId }).populate(['husband']).exec();

        return [...res1, ...res2];
    }

    /**
     * Delete all spouse relationships for a person (cascade delete)
     */
    async deleteSpousesByPersonId(personId: string) {
        if (!Types.ObjectId.isValid(personId)) {
            throw new NotFoundException(`Invalid person ID: ${personId}`);
        }

        // Find all spouse relationships for this person
        const spouseRelationships = await this.spouseModel.find({ $or: [{ husband: personId }, { wife: personId }] }).exec();

        // Delete children for each spouse relationship
        for (const spouse of spouseRelationships) {
            await this.parentChildService.deleteByParentId(spouse._id.toString());
        }

        // Delete where person is husband
        const result1 = await this.spouseModel.deleteMany({ husband: personId }).exec();

        // Delete where person is wife
        const result2 = await this.spouseModel.deleteMany({ wife: personId }).exec();

        const totalDeleted = result1.deletedCount + result2.deletedCount;
        return {
            message: `Deleted ${totalDeleted} spouse relationship(s)`,
            deletedCount: totalDeleted,
        };
    }
}
