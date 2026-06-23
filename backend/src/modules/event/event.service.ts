import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event } from './schemas/event.schema';
import { Person } from '../person/schemas/person.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventSourceType, EventCalendar, EventTrigger } from './constants';
import { TelegramService } from './telegram.service';
import { solarToLunarParts } from './utils/lunarParts';
import { nextOccurrence, getActiveTriggers, daysUntil } from './utils/eventOccurrence';

@Injectable()
export class EventService {
    constructor(
        @InjectModel(Event.name) private readonly eventModel: Model<Event>,
        @InjectModel(Person.name) private readonly personModel: Model<Person>,
        private readonly telegram: TelegramService,
    ) {}

    // ---------- Sync từ Person (Cách A) ----------
    async syncPersonEvents(person: any): Promise<void> {
        const pid = person._id;

        if (person.isDead && person.death) {
            const parts = solarToLunarParts(new Date(person.death));
            await this.eventModel.updateOne(
                { sourceType: EventSourceType.DEATH, sourcePersonId: pid },
                {
                    $set: {
                        calendar: EventCalendar.LUNAR,
                        day: parts.day,
                        month: parts.month,
                        isLeapMonth: parts.isLeapMonth,
                        title: `Giỗ ${person.name}`,
                    },
                    $setOnInsert: { isActive: true },
                },
                { upsert: true },
            );
        } else {
            await this.eventModel.deleteOne({ sourceType: EventSourceType.DEATH, sourcePersonId: pid });
        }

        if (person.birth) {
            const d = new Date(person.birth);
            await this.eventModel.updateOne(
                { sourceType: EventSourceType.BIRTH, sourcePersonId: pid },
                {
                    $set: {
                        calendar: EventCalendar.SOLAR,
                        day: d.getDate(),
                        month: d.getMonth() + 1,
                        isLeapMonth: false,
                        title: `Sinh nhật ${person.name}`,
                    },
                    $setOnInsert: { isActive: true },
                },
                { upsert: true },
            );
        } else {
            await this.eventModel.deleteOne({ sourceType: EventSourceType.BIRTH, sourcePersonId: pid });
        }
    }

    async removePersonEvents(personId: string): Promise<void> {
        await this.eventModel.deleteMany({ sourcePersonId: personId });
    }

    async syncAll(): Promise<{ processed: number; deletedOrphans: number }> {
        const persons = await this.personModel.find().exec();
        const validIds = new Set(persons.map((p: any) => p._id.toString()));

        for (const p of persons) {
            await this.syncPersonEvents(p);
        }

        const autoEvents = await this.eventModel
            .find({ sourceType: { $in: [EventSourceType.DEATH, EventSourceType.BIRTH] } })
            .exec();
        const orphanIds = autoEvents
            .filter((e) => {
                const sid = e.sourcePersonId ? e.sourcePersonId.toString() : null;
                return !sid || !validIds.has(sid);
            })
            .map((e) => e._id);
        if (orphanIds.length > 0) {
            await this.eventModel.deleteMany({ _id: { $in: orphanIds } });
        }
        return { processed: persons.length, deletedOrphans: orphanIds.length };
    }

    // ---------- CRUD ----------
    async create(dto: CreateEventDto): Promise<Event> {
        return this.eventModel.create({ ...dto, sourceType: EventSourceType.MANUAL, sourcePersonId: null });
    }

    async findAll(): Promise<any[]> {
        const today = new Date();
        const events = await this.eventModel.find().lean().exec();
        return events
            .map((e) => ({ ...e, nextOccurrence: nextOccurrence(e as any, today) }))
            .sort((a, b) => {
                if (!a.nextOccurrence) return 1;
                if (!b.nextOccurrence) return -1;
                return a.nextOccurrence.getTime() - b.nextOccurrence.getTime();
            });
    }

    async update(id: string, dto: UpdateEventDto): Promise<Event> {
        if (!Types.ObjectId.isValid(id)) throw new NotFoundException(`Invalid event ID: ${id}`);
        const event = await this.eventModel.findById(id).exec();
        if (!event) throw new NotFoundException(`Event ${id} not found`);

        if (event.sourceType !== EventSourceType.MANUAL) {
            const providedKeys = Object.keys(dto).filter((k) => (dto as any)[k] !== undefined);
            if (providedKeys.some((k) => k !== 'desc' && k !== 'isActive')) {
                throw new BadRequestException('Auto-event chỉ cho phép sửa desc/isActive');
            }
            const allowed: UpdateEventDto = {};
            if (dto.desc !== undefined) allowed.desc = dto.desc;
            if (dto.isActive !== undefined) allowed.isActive = dto.isActive;
            return this.eventModel.findByIdAndUpdate(id, allowed, { new: true }).exec();
        }
        return this.eventModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    }

    async remove(id: string): Promise<{ message: string }> {
        if (!Types.ObjectId.isValid(id)) throw new NotFoundException(`Invalid event ID: ${id}`);
        const deleted = await this.eventModel.findByIdAndDelete(id).exec();
        if (!deleted) throw new NotFoundException(`Event ${id} not found`);
        return { message: `Event ${id} deleted` };
    }

    // ---------- Notifications (FE + Telegram dùng chung) ----------
    async getNotifications(): Promise<any[]> {
        const today = new Date();
        const events = await this.eventModel.find({ isActive: true }).lean().exec();
        const result = [];
        for (const e of events) {
            const triggers = getActiveTriggers(e as any, today);
            if (triggers.length === 0) continue;
            const occ = nextOccurrence(e as any, today);
            result.push({
                event: e,
                triggers,
                occurrenceSolar: occ,
                daysUntil: occ ? daysUntil(occ, today) : null,
            });
        }
        result.sort((a, b) => (a.daysUntil ?? 9999) - (b.daysUntil ?? 9999));
        return result;
    }

    private triggerLabel(t: EventTrigger): string {
        switch (t) {
            case EventTrigger.DAY_OF: return '🔔 HÔM NAY';
            case EventTrigger.ONE_WEEK: return 'Còn 1 tuần';
            case EventTrigger.ONE_MONTH: return 'Còn 1 tháng';
            case EventTrigger.WEEK_START: return 'Đầu tuần';
            case EventTrigger.MONTH_START: return 'Đầu tháng';
            default: return '';
        }
    }

    async runDailyNotify(): Promise<{ events: number; sent: number }> {
        const notifications = await this.getNotifications();
        if (notifications.length === 0) return { events: 0, sent: 0 };

        const blocks = notifications.map((n) => {
            const occ: Date = n.occurrenceSolar;
            const occStr = occ ? `${occ.getDate()}/${occ.getMonth() + 1}/${occ.getFullYear()}` : '';
            const labels = n.triggers.map((t: EventTrigger) => this.triggerLabel(t)).filter(Boolean).join(' · ');
            return `<b>${n.event.title}</b>\nNgày: ${occStr} (còn ${n.daysUntil} ngày)\n${labels}`;
        });

        const today = new Date();
        const header = `📅 <b>Lịch sự kiện dòng họ — ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}</b>`;
        const messages = this.telegram.buildMessages(blocks, header);
        const { sent } = await this.telegram.send(messages);
        return { events: notifications.length, sent };
    }
}
