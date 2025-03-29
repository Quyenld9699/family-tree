import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpouseDto } from './dto/create-spouse.dto';
import { UpdateSpouseDto } from './dto/update-spouse.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Spouse } from './schemas/spouse.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class SpouseService {
    constructor(@InjectModel(Spouse.name) private readonly spouseModel: Model<Spouse>) {}

    async create(createSpouseDto: CreateSpouseDto) {
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
}
