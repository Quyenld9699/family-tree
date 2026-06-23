import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventService } from './event.service';
import { Event } from './schemas/event.schema';
import { Person } from '../person/schemas/person.schema';
import { EventSourceType } from './constants';

describe('EventService.syncPersonEvents', () => {
    let service: EventService;
    let eventModel: any;

    beforeEach(async () => {
        eventModel = {
            updateOne: jest.fn().mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 }),
            deleteOne: jest.fn().mockResolvedValue({ deletedCount: 0 }),
        };
        const moduleRef = await Test.createTestingModule({
            providers: [
                EventService,
                { provide: getModelToken(Event.name), useValue: eventModel },
                { provide: getModelToken(Person.name), useValue: {} },
            ],
        }).compile();
        service = moduleRef.get(EventService);
    });

    it('upserts a death (giỗ, lunar) event when person is dead with death date', async () => {
        await service.syncPersonEvents({
            _id: 'p1', name: 'Ông A', isDead: true, death: new Date(2020, 2, 10), birth: null,
        } as any);

        const deathCall = eventModel.updateOne.mock.calls.find(
            (c: any[]) => c[0].sourceType === EventSourceType.DEATH,
        );
        expect(deathCall).toBeDefined();
        expect(deathCall[0]).toEqual({ sourceType: EventSourceType.DEATH, sourcePersonId: 'p1' });
        expect(deathCall[1].$set.calendar).toBe('lunar');
        expect(deathCall[1].$set.title).toBe('Giỗ Ông A');
    });

    it('upserts a birth (sinh nhật, solar) event when person has birth date', async () => {
        await service.syncPersonEvents({
            _id: 'p1', name: 'Ông A', isDead: false, death: null, birth: new Date(1950, 7, 20),
        } as any);

        const birthCall = eventModel.updateOne.mock.calls.find(
            (c: any[]) => c[0].sourceType === EventSourceType.BIRTH,
        );
        expect(birthCall[1].$set.calendar).toBe('solar');
        expect(birthCall[1].$set.day).toBe(20);
        expect(birthCall[1].$set.month).toBe(8);
        expect(birthCall[1].$set.title).toBe('Sinh nhật Ông A');
    });

    it('deletes death event when person is not dead', async () => {
        await service.syncPersonEvents({
            _id: 'p1', name: 'Ông A', isDead: false, death: null, birth: null,
        } as any);
        expect(eventModel.deleteOne).toHaveBeenCalledWith({ sourceType: EventSourceType.DEATH, sourcePersonId: 'p1' });
    });
});
