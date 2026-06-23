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

describe('EventService.update (auto-event guard)', () => {
    let service: EventService;
    let eventModel: any;

    const buildModule = async () => {
        const { Test } = await import('@nestjs/testing');
        const { getModelToken } = await import('@nestjs/mongoose');
        const moduleRef = await Test.createTestingModule({
            providers: [
                EventService,
                { provide: getModelToken(Event.name), useValue: eventModel },
                { provide: getModelToken(Person.name), useValue: {} },
            ],
        }).compile();
        return moduleRef.get(EventService);
    };

    const validId = '507f1f77bcf86cd799439011';

    it('rejects changing a non-desc/isActive field on an auto (death) event', async () => {
        eventModel = {
            findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: validId, sourceType: 'death' }) }),
            findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
        };
        service = await buildModule();
        await expect(service.update(validId, { day: 5 } as any)).rejects.toThrow();
        expect(eventModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('allows updating desc on an auto event', async () => {
        eventModel = {
            findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: validId, sourceType: 'birth' }) }),
            findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: validId, desc: 'new' }) }),
        };
        service = await buildModule();
        await service.update(validId, { desc: 'new' } as any);
        expect(eventModel.findByIdAndUpdate).toHaveBeenCalledWith(validId, { desc: 'new' }, { new: true });
    });
});

describe('EventService.syncAll (orphan cleanup)', () => {
    let service: EventService;
    let eventModel: any;

    it('deletes auto-events whose person no longer exists', async () => {
        const persons = [{ _id: { toString: () => 'p1' }, name: 'A', isDead: false, death: null, birth: null }];
        eventModel = {
            updateOne: jest.fn().mockResolvedValue({}),
            deleteOne: jest.fn().mockResolvedValue({}),
            deleteMany: jest.fn().mockResolvedValue({}),
            find: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([
                    { _id: 'e1', sourceType: 'death', sourcePersonId: { toString: () => 'pX' } }, // orphan
                    { _id: 'e2', sourceType: 'birth', sourcePersonId: { toString: () => 'p1' } }, // valid
                ]),
            }),
        };
        const personModel = { find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(persons) }) };

        const { Test } = await import('@nestjs/testing');
        const { getModelToken } = await import('@nestjs/mongoose');
        const moduleRef = await Test.createTestingModule({
            providers: [
                EventService,
                { provide: getModelToken(Event.name), useValue: eventModel },
                { provide: getModelToken(Person.name), useValue: personModel },
            ],
        }).compile();
        service = moduleRef.get(EventService);

        const res = await service.syncAll();
        expect(eventModel.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['e1'] } });
        expect(res.deletedOrphans).toBe(1);
        expect(res.processed).toBe(1);
    });
});
