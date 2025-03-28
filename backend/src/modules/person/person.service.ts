import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Person } from './schemas/person.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class PersonService {
    constructor(@InjectModel(Person.name) private readonly personModel: Model<Person>) {}

    async create(createPersonDto: CreatePersonDto) {
        console.log(createPersonDto);
        const newPerson = await this.personModel.create(createPersonDto);
        return newPerson;
    }

    async findAll() {
        return await this.personModel.find().exec();
    }

    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid person ID: ${id}`);
        }

        const person = await this.personModel.findById(id).exec();

        if (!person) {
            throw new NotFoundException(`Person with ID ${id} not found`);
        }

        return person;
    }

    async update(id: string, updatePersonDto: UpdatePersonDto) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid person ID: ${id}`);
        }

        const updatedPerson = await this.personModel.findByIdAndUpdate(id, updatePersonDto, { new: true }).exec();

        if (!updatedPerson) {
            throw new NotFoundException(`Person with ID ${id} not found`);
        }

        return updatedPerson;
    }

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid person ID: ${id}`);
        }

        const deletedPerson = await this.personModel.findByIdAndDelete(id).exec();

        if (!deletedPerson) {
            throw new NotFoundException(`Person with ID ${id} not found`);
        }

        return { message: `Person with ID ${id} has been successfully deleted` };
    }
}
