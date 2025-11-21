import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateParentChildDto } from './dto/create-parent-child.dto';
import { UpdateParentChildDto } from './dto/update-parent-child.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ParentChild } from './schemas/parent-child.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class ParentChildService {
    constructor(@InjectModel(ParentChild.name) private readonly parentChildModel: Model<ParentChild>) {}

    async create(createParentChildDto: CreateParentChildDto) {
        const newParentChild = await this.parentChildModel.create(createParentChildDto);
        return await newParentChild.populate([{ path: 'parent', populate: ['husband', 'wife'] }, 'child']);
    }

    async findAll() {
        return await this.parentChildModel
            .find()
            .populate([{ path: 'parent', populate: ['husband', 'wife'] }, 'child'])
            .exec();
    }

    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid parent-child relationship ID: ${id}`);
        }

        const parentChild = await this.parentChildModel
            .findById(id)
            .populate([{ path: 'parent', populate: ['husband', 'wife'] }, 'child'])
            .exec();

        if (!parentChild) {
            throw new NotFoundException(`Parent-child relationship with ID ${id} not found`);
        }

        return parentChild;
    }

    async findByChild(childId: string) {
        if (!Types.ObjectId.isValid(childId)) {
            throw new NotFoundException(`Invalid child ID: ${childId}`);
        }

        return await this.parentChildModel
            .find({ child: childId })
            .populate([{ path: 'parent', populate: ['husband', 'wife'] }])
            .exec();
    }

    async findAllChildIdsByParent(parentId: string) {
        if (!Types.ObjectId.isValid(parentId)) {
            throw new NotFoundException(`Invalid parent ID: ${parentId}`);
        }

        return await this.parentChildModel.find({ parent: parentId }).distinct('child').exec();
    }

    async findByParent(parentId: string) {
        if (!Types.ObjectId.isValid(parentId)) {
            throw new NotFoundException(`Invalid parent ID: ${parentId}`);
        }

        return await this.parentChildModel.find({ parent: parentId }).populate(['child']).exec();
    }

    async update(id: string, updateParentChildDto: UpdateParentChildDto) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid parent-child relationship ID: ${id}`);
        }

        const updatedParentChild = await this.parentChildModel
            .findByIdAndUpdate(id, updateParentChildDto, { new: true })
            .populate([{ path: 'parent', populate: ['husband', 'wife'] }, 'child'])
            .exec();

        if (!updatedParentChild) {
            throw new NotFoundException(`Parent-child relationship with ID ${id} not found`);
        }

        return updatedParentChild;
    }

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid parent-child relationship ID: ${id}`);
        }

        const deletedParentChild = await this.parentChildModel.findByIdAndDelete(id).exec();

        if (!deletedParentChild) {
            throw new NotFoundException(`Parent-child relationship with ID ${id} not found`);
        }

        return { message: `Parent-child relationship with ID ${id} has been successfully deleted` };
    }

    /**
     * Delete all parent-child relationships where person is the child (cascade delete)
     */
    async deleteChildRelationships(childId: string) {
        if (!Types.ObjectId.isValid(childId)) {
            throw new NotFoundException(`Invalid child ID: ${childId}`);
        }

        const result = await this.parentChildModel.deleteMany({ child: childId }).exec();

        return {
            message: `Deleted ${result.deletedCount} parent-child relationship(s) for child`,
            deletedCount: result.deletedCount,
        };
    }

    /**
     * Delete all parent-child relationships for a spouse relationship (cascade delete)
     */
    async deleteByParentId(parentId: string) {
        if (!Types.ObjectId.isValid(parentId)) {
            throw new NotFoundException(`Invalid parent ID: ${parentId}`);
        }

        const result = await this.parentChildModel.deleteMany({ parent: parentId }).exec();

        return {
            message: `Deleted ${result.deletedCount} parent-child relationship(s) for parent`,
            deletedCount: result.deletedCount,
        };
    }
}
