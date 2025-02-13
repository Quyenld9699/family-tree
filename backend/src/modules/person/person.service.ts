import { Injectable } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Person } from './schemas/person.schema';
import { Model } from 'mongoose';

@Injectable()
export class PersonService {
    constructor(@InjectModel(Person.name) private readonly personModel: Model<Person>) {}

    async create(createPersonDto: CreatePersonDto) {
        const newPerson = await this.personModel.create(createPersonDto);
        return newPerson;
    }

    async findAll() {
        return await this.personModel.find().exec();
    }

    findOne(id: number) {
        return `This action returns a #${id} person`;
    }

    update(id: number, updatePersonDto: UpdatePersonDto) {
        return `This action updates a #${id} person`;
    }

    remove(id: number) {
        return `This action removes a #${id} person`;
    }
}
