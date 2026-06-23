import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schemas/event.schema';
import { Person, PersonSchema } from '../person/schemas/person.schema';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { TelegramService } from './telegram.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Event.name, schema: EventSchema },
            { name: Person.name, schema: PersonSchema },
        ]),
    ],
    controllers: [EventController],
    providers: [EventService, TelegramService],
    exports: [EventService],
})
export class EventModule {}
