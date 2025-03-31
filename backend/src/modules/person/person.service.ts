import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Person } from './schemas/person.schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { SpouseService } from '../spouse/spouse.service';
import { ParentChildService } from '../parent-child/parent-child.service';

@Injectable()
export class PersonService {
    constructor(
        @InjectModel(Person.name) private readonly personModel: Model<Person>,
        private readonly spouseService: SpouseService,
        private readonly parentChildService: ParentChildService,
    ) {}

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

    async getGenerationByPerson(personId: string) {
        if (!Types.ObjectId.isValid(personId)) {
            throw new NotFoundException(`Invalid person ID: ${personId}`);
        }

        const person = await this.personModel.findById(personId).exec();
        if (!person) {
            throw new NotFoundException(`Person with ID ${personId} not found`);
        }

        const personObject = person.toObject();
        // Create a map to store person objects by their IDs
        let personInFamily: Record<string, any> = {
            [personId]: personObject,
        };
        const spouseRelationships = await this.spouseService.findByPerson(personId);

        const tree = {
            user: personId,
            spouses: [],
        };
        // Get generation 1st is spouse relationships
        for (const relationship of spouseRelationships) {
            const spouseObject = relationship.toJSON();
            const children = await this.parentChildService.findAllChildIdsByParent(relationship._id.toString());
            if (personId === relationship.husband.toString()) {
                const wifeId = (relationship.wife as any)._id.toString();
                personInFamily[wifeId] = spouseObject.wife;
                // console.log(personInFamily);
                tree.spouses.push({
                    user: { id: wifeId, spouseOrder: relationship.husbandOrder },
                    spouseOrder: relationship.wifeOrder,
                    marriageDate: relationship.marriageDate,
                    divorceDate: relationship.divorceDate,
                    children: children,
                });
            } else {
                const husbandId = (relationship.husband as any)._id.toString();
                personInFamily[husbandId] = spouseObject.husband;
                tree.spouses.push({
                    user: { id: husbandId, spouseOrder: relationship.wifeOrder },
                    spouseOrder: relationship.husbandOrder,
                    marriageDate: relationship.marriageDate,
                    divorceDate: relationship.divorceDate,
                    children: children,
                });
            }
        }

        console.log('119', personInFamily);

        return {
            personData: personInFamily,
            tree: tree,
        };
    }

    async getNGenerations(personId: string, generations: number) {
        let personData = {};
        const treeData = [];

        let firstGeneration = await this.getGenerationByPerson(personId);
        personData = firstGeneration.personData;

        treeData.push([firstGeneration.tree]);

        let allPousesInGeneration = firstGeneration.tree.spouses;
        for (let i = 1; i < generations; i++) {
            if (allPousesInGeneration.length > 0) {
                const queryNextGenFn = [];

                for (const spouse of allPousesInGeneration) {
                    if (spouse.children.length > 0) {
                        for (const child of spouse.children) {
                            queryNextGenFn.push(this.getGenerationByPerson(child));
                        }
                    }
                }

                const generationData = await Promise.all(queryNextGenFn);

                const subtree = [];
                allPousesInGeneration = [];
                for (const subFamily of generationData) {
                    personData = { ...personData, ...subFamily.personData };
                    subtree.push([subFamily.tree]);
                    allPousesInGeneration.push(...subFamily.tree.spouses);
                }
                treeData.push(subtree);
            }
        }

        return {
            personData: personData,
            treeData: treeData,
        };
    }
}
