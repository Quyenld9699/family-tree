import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from './schemas/person.schema';
import { SpouseModule } from '../spouse/spouse.module';
import { ParentChildModule } from '../parent-child/parent-child.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]), SpouseModule, ParentChildModule],
    controllers: [PersonController],
    providers: [PersonService],
    exports: [PersonService],
})
export class PersonModule {}
