# Event System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm bảng `Event` (giỗ/sinh nhật/lễ gia đình) tự đồng bộ từ Person, hiển thị thông báo ở FE và gửi Telegram qua Vercel Cron mỗi sáng.

**Architecture:** Collection `events` lưu rule lặp (day/month/calendar/isLeapMonth), tính occurrence on-the-fly bằng `lunar-javascript`. `PersonService` gọi `EventService` (Cách A) để upsert/xóa auto-event khi person thay đổi. Một daily cron tính 5 mốc thông báo dùng chung cho FE và Telegram.

**Tech Stack:** NestJS + Mongoose + lunar-javascript (backend), Next.js + React Query (frontend), Vercel Cron + Telegram Bot API.

**Spec:** `docs/superpowers/specs/2026-06-23-event-system-design.md`

---

## File Structure

**Backend (mới trừ khi ghi rõ "Modify"):**
- `backend/src/modules/event/schemas/event.schema.ts` — Mongoose schema + index
- `backend/src/modules/event/constants.ts` — enums `EventSourceType`, `EventCalendar`, `EventTrigger`
- `backend/src/modules/event/utils/lunarParts.ts` — đổi Date dương → bộ phận âm/dương lịch
- `backend/src/modules/event/utils/eventOccurrence.ts` — `nextOccurrence`, `getActiveTriggers` (thuần)
- `backend/src/modules/event/utils/eventOccurrence.spec.ts` — unit test
- `backend/src/modules/event/dto/create-event.dto.ts`, `update-event.dto.ts`
- `backend/src/modules/event/event.service.ts` (+ `.spec.ts`) — CRUD, sync, notifications, telegram digest
- `backend/src/modules/event/telegram.service.ts` — gửi message Telegram (split 4096)
- `backend/src/modules/event/event.controller.ts` — REST + cron endpoint
- `backend/src/modules/event/event.module.ts`
- `backend/src/app.module.ts` — Modify: import `EventModule`
- `backend/src/modules/person/person.module.ts` — Modify: import `EventModule`
- `backend/src/modules/person/person.service.ts` — Modify: gọi `EventService` trong create/update/remove
- `backend/vercel.json` — Modify: thêm `crons`
- `backend/package.json` — Modify: thêm dependency `lunar-javascript`

**Frontend:**
- `frontend/src/services/eventService.ts` — CRUD + notifications (auth-gated)
- `frontend/src/hooks/useEvents.ts` — React Query hooks
- `frontend/src/views/Events/EventsView.tsx` (+ form/list components) — page nội dung
- `frontend/src/app/events/page.tsx` — route
- `frontend/src/components/GioBellIcon/GioBellIcon.tsx` — Modify: nhận event notifications
- `frontend/src/views/Root/components/TopBar.tsx` — Modify: dùng `useEventNotifications`
- `frontend/src/hooks/useGioReminders.ts` — Delete (thay bằng event)

---

## Task 1: Thêm dependency lunar-javascript cho backend

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Cài lunar-javascript**

Run trong `backend/`:
```bash
npm install lunar-javascript
```
Expected: `package.json` dependencies có `"lunar-javascript": "^1.x"`.

- [ ] **Step 2: Tạo type shim (lib không có types riêng tốt)**

Tạo `backend/src/modules/event/lunar-javascript.d.ts`:
```ts
declare module 'lunar-javascript' {
    export class Solar {
        static fromDate(date: Date): Solar;
        static fromYmd(year: number, month: number, day: number): Solar;
        getLunar(): Lunar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
    }
    export class Lunar {
        static fromYmd(year: number, month: number, day: number): Lunar;
        getSolar(): Solar;
        getYear(): number;
        getMonth(): number;
        getDay(): number;
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/modules/event/lunar-javascript.d.ts
git commit -m "chore(backend): add lunar-javascript dependency and types"
```

---

## Task 2: Event constants

**Files:**
- Create: `backend/src/modules/event/constants.ts`

- [ ] **Step 1: Viết enums**

```ts
export enum EventSourceType {
    DEATH = 'death',
    BIRTH = 'birth',
    MANUAL = 'manual',
}

export enum EventCalendar {
    LUNAR = 'lunar',
    SOLAR = 'solar',
}

export enum EventTrigger {
    ONE_MONTH = '1_month',
    ONE_WEEK = '1_week',
    MONTH_START = 'month_start',
    WEEK_START = 'week_start',
    DAY_OF = 'day_of',
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/event/constants.ts
git commit -m "feat(event): add event constants"
```

---

## Task 3: Lunar/solar parts util

**Files:**
- Create: `backend/src/modules/event/utils/lunarParts.ts`

- [ ] **Step 1: Viết util**

```ts
import { Solar } from 'lunar-javascript';

export interface DateParts {
    day: number;
    month: number;
    isLeapMonth: boolean;
}

/** Đổi 1 Date dương lịch → bộ phận ÂM lịch (day, month, isLeapMonth). */
export function solarToLunarParts(date: Date): DateParts {
    const lunar = Solar.fromDate(date).getLunar();
    return {
        day: lunar.getDay(),
        month: Math.abs(lunar.getMonth()), // âm = tháng nhuận
        isLeapMonth: lunar.getMonth() < 0,
    };
}

/** Đổi 1 Date dương lịch → bộ phận DƯƠNG lịch (day, month). */
export function solarToSolarParts(date: Date): DateParts {
    return { day: date.getDate(), month: date.getMonth() + 1, isLeapMonth: false };
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/event/utils/lunarParts.ts
git commit -m "feat(event): add lunar/solar parts util"
```

---

## Task 4: Occurrence & trigger util (TDD)

**Files:**
- Create: `backend/src/modules/event/utils/eventOccurrence.ts`
- Test: `backend/src/modules/event/utils/eventOccurrence.spec.ts`

- [ ] **Step 1: Viết failing test**

`eventOccurrence.spec.ts`:
```ts
import { EventCalendar, EventTrigger } from '../constants';
import { nextOccurrence, getActiveTriggers, OccurrenceInput } from './eventOccurrence';

const solarEvent: OccurrenceInput = { calendar: EventCalendar.SOLAR, day: 15, month: 6 };

describe('nextOccurrence (solar)', () => {
    it('returns this year occurrence when not yet passed', () => {
        const occ = nextOccurrence(solarEvent, new Date(2026, 5, 1)); // 1 Jun 2026
        expect(occ).toEqual(new Date(2026, 5, 15));
    });

    it('rolls to next year when already passed', () => {
        const occ = nextOccurrence(solarEvent, new Date(2026, 5, 20)); // 20 Jun 2026
        expect(occ).toEqual(new Date(2027, 5, 15));
    });
});

describe('getActiveTriggers (solar)', () => {
    it('fires day_of on the exact day', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 5, 15));
        expect(t).toContain(EventTrigger.DAY_OF);
    });

    it('fires 1_week exactly 7 days before', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 5, 8));
        expect(t).toContain(EventTrigger.ONE_WEEK);
    });

    it('fires 1_month exactly one month before', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 4, 15));
        expect(t).toContain(EventTrigger.ONE_MONTH);
    });

    it('fires month_start on the 1st of the occurrence month', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 5, 1));
        expect(t).toContain(EventTrigger.MONTH_START);
    });

    it('returns empty on an unrelated day', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 2, 3));
        expect(t).toEqual([]);
    });
});

describe('lunar occurrence', () => {
    it('computes a valid solar Date for a lunar event', () => {
        const lunar: OccurrenceInput = { calendar: EventCalendar.LUNAR, day: 10, month: 3, isLeapMonth: false };
        const occ = nextOccurrence(lunar, new Date(2026, 0, 1));
        expect(occ).toBeInstanceOf(Date);
        expect(occ!.getFullYear()).toBeGreaterThanOrEqual(2026);
    });
});
```

- [ ] **Step 2: Run test, verify FAIL**

Run trong `backend/`:
```bash
npx jest eventOccurrence
```
Expected: FAIL — "Cannot find module './eventOccurrence'".

- [ ] **Step 3: Implement util**

`eventOccurrence.ts`:
```ts
import { Solar, Lunar } from 'lunar-javascript';
import { EventCalendar, EventTrigger } from '../constants';

export interface OccurrenceInput {
    calendar: EventCalendar | 'lunar' | 'solar';
    day: number;
    month: number;
    isLeapMonth?: boolean;
}

export function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function mondayOf(d: Date): Date {
    const offset = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    return addDays(d, -offset);
}

/** Solar Date của event trong 1 "chu kỳ năm" (solar year hoặc lunar year). */
function occurrenceForCycle(ev: OccurrenceInput, cycleYear: number): Date | null {
    if (ev.calendar === EventCalendar.SOLAR || ev.calendar === 'solar') {
        return new Date(cycleYear, ev.month - 1, ev.day);
    }
    try {
        const m = ev.isLeapMonth ? -ev.month : ev.month;
        const l = Lunar.fromYmd(cycleYear, m, ev.day);
        const s = l.getSolar();
        return new Date(s.getYear(), s.getMonth() - 1, s.getDay());
    } catch {
        return null;
    }
}

/** Lần xảy ra sắp tới (>= hôm nay). Cuộn sang năm sau nếu đã qua. */
export function nextOccurrence(ev: OccurrenceInput, today: Date): Date | null {
    const t = startOfDay(today);
    if (ev.calendar === EventCalendar.SOLAR || ev.calendar === 'solar') {
        let occ = occurrenceForCycle(ev, t.getFullYear());
        if (occ && occ < t) occ = occurrenceForCycle(ev, t.getFullYear() + 1);
        return occ;
    }
    const curLunarYear = Solar.fromDate(t).getLunar().getYear();
    let occ = occurrenceForCycle(ev, curLunarYear);
    if (occ && occ >= t) return occ;
    return occurrenceForCycle(ev, curLunarYear + 1);
}

/** Các mốc thông báo đang khớp hôm nay (rỗng nếu không có). */
export function getActiveTriggers(ev: OccurrenceInput, today: Date): EventTrigger[] {
    const t = startOfDay(today);
    const occ = nextOccurrence(ev, t);
    if (!occ) return [];

    const triggers: EventTrigger[] = [];
    if (sameDay(t, occ)) triggers.push(EventTrigger.DAY_OF);
    if (sameDay(t, addDays(occ, -7))) triggers.push(EventTrigger.ONE_WEEK);
    if (sameDay(t, new Date(occ.getFullYear(), occ.getMonth() - 1, occ.getDate()))) triggers.push(EventTrigger.ONE_MONTH);
    if (sameDay(t, new Date(occ.getFullYear(), occ.getMonth(), 1))) triggers.push(EventTrigger.MONTH_START);
    if (sameDay(t, mondayOf(occ))) triggers.push(EventTrigger.WEEK_START);
    return triggers;
}

/** Số ngày từ hôm nay đến occurrence (0 = hôm nay). */
export function daysUntil(occ: Date, today: Date): number {
    const ms = startOfDay(occ).getTime() - startOfDay(today).getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
}
```

- [ ] **Step 4: Run test, verify PASS**

```bash
npx jest eventOccurrence
```
Expected: PASS (toàn bộ test).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/event/utils/eventOccurrence.ts backend/src/modules/event/utils/eventOccurrence.spec.ts
git commit -m "feat(event): add occurrence and trigger util with tests"
```

---

## Task 5: Event schema

**Files:**
- Create: `backend/src/modules/event/schemas/event.schema.ts`

- [ ] **Step 1: Viết schema + index**

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EventSourceType, EventCalendar } from '../constants';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
    @Prop({ required: true })
    title: string;

    @Prop()
    desc: string;

    @Prop({ required: true, enum: Object.values(EventSourceType), default: EventSourceType.MANUAL })
    sourceType: EventSourceType;

    @Prop({ type: Types.ObjectId, ref: 'Person', default: null })
    sourcePersonId: Types.ObjectId | null;

    @Prop({ required: true, enum: Object.values(EventCalendar) })
    calendar: EventCalendar;

    @Prop({ required: true, type: Number, min: 1, max: 31 })
    day: number;

    @Prop({ required: true, type: Number, min: 1, max: 12 })
    month: number;

    @Prop({ default: false })
    isLeapMonth: boolean;

    @Prop({ default: true })
    isActive: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Mỗi person tối đa 1 giỗ + 1 sinh nhật. Manual (sourcePersonId null) không bị ràng buộc.
EventSchema.index(
    { sourceType: 1, sourcePersonId: 1 },
    { unique: true, partialFilterExpression: { sourcePersonId: { $type: 'objectId' } } },
);
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/event/schemas/event.schema.ts
git commit -m "feat(event): add Event schema with partial unique index"
```

---

## Task 6: Event DTOs

**Files:**
- Create: `backend/src/modules/event/dto/create-event.dto.ts`
- Create: `backend/src/modules/event/dto/update-event.dto.ts`

- [ ] **Step 1: Viết CreateEventDto (chỉ cho manual event)**

`create-event.dto.ts`:
```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';
import { EventCalendar } from '../constants';

export class CreateEventDto {
    @ApiProperty({ description: 'Tên sự kiện' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    desc?: string;

    @ApiProperty({ enum: EventCalendar, description: 'Âm hoặc dương lịch' })
    @IsEnum(EventCalendar)
    calendar: EventCalendar;

    @ApiProperty({ description: 'Ngày (1-31)' })
    @IsInt()
    @Min(1)
    @Max(31)
    day: number;

    @ApiProperty({ description: 'Tháng (1-12)' })
    @IsInt()
    @Min(1)
    @Max(12)
    month: number;

    @ApiProperty({ required: false, description: 'Tháng nhuận (chỉ âm lịch)' })
    @IsOptional()
    @IsBoolean()
    isLeapMonth?: boolean;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
```

- [ ] **Step 2: Viết UpdateEventDto**

`update-event.dto.ts`:
```ts
import { PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/event/dto
git commit -m "feat(event): add create/update event DTOs"
```

---

## Task 7: EventService — sync logic (TDD)

**Files:**
- Create: `backend/src/modules/event/event.service.ts`
- Test: `backend/src/modules/event/event.service.spec.ts`

- [ ] **Step 1: Viết failing test cho sync**

`event.service.spec.ts`:
```ts
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
```

- [ ] **Step 2: Run test, verify FAIL**

```bash
npx jest event.service
```
Expected: FAIL — "Cannot find module './event.service'".

- [ ] **Step 3: Implement EventService**

`event.service.ts`:
```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event } from './schemas/event.schema';
import { Person } from '../person/schemas/person.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventSourceType, EventCalendar, EventTrigger } from './constants';
import { solarToLunarParts } from './utils/lunarParts';
import { nextOccurrence, getActiveTriggers, daysUntil } from './utils/eventOccurrence';

@Injectable()
export class EventService {
    constructor(
        @InjectModel(Event.name) private readonly eventModel: Model<Event>,
        @InjectModel(Person.name) private readonly personModel: Model<Person>,
    ) {}

    // ---------- Sync từ Person (Cách A) ----------
    async syncPersonEvents(person: any): Promise<void> {
        const pid = person._id;

        // GIỖ (âm lịch)
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

        // SINH NHẬT (dương lịch)
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

        // Dọn orphan: auto-event trỏ tới person không còn tồn tại
        const autoEvents = await this.eventModel
            .find({ sourceType: { $in: [EventSourceType.DEATH, EventSourceType.BIRTH] } })
            .exec();
        let deletedOrphans = 0;
        for (const e of autoEvents) {
            const sid = e.sourcePersonId ? e.sourcePersonId.toString() : null;
            if (!sid || !validIds.has(sid)) {
                await this.eventModel.deleteOne({ _id: e._id });
                deletedOrphans++;
            }
        }
        return { processed: persons.length, deletedOrphans };
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

        // Auto-event chỉ cho sửa desc/isActive
        if (event.sourceType !== EventSourceType.MANUAL) {
            const allowed: UpdateEventDto = {};
            if (dto.desc !== undefined) allowed.desc = dto.desc;
            if (dto.isActive !== undefined) allowed.isActive = dto.isActive;
            if (Object.keys(dto).some((k) => k !== 'desc' && k !== 'isActive')) {
                throw new BadRequestException('Auto-event chỉ cho phép sửa desc/isActive');
            }
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
}
```

- [ ] **Step 4: Run test, verify PASS**

```bash
npx jest event.service
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/event/event.service.ts backend/src/modules/event/event.service.spec.ts
git commit -m "feat(event): add EventService with sync/CRUD/notifications and tests"
```

---

## Task 8: TelegramService + digest

**Files:**
- Create: `backend/src/modules/event/telegram.service.ts`
- Modify: `backend/src/modules/event/event.service.ts` (thêm `runDailyNotify`)

- [ ] **Step 1: Viết TelegramService**

`telegram.service.ts`:
```ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TELEGRAM_MAX = 4000; // chừa biên dưới 4096

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);

    constructor(private readonly config: ConfigService) {}

    /** Chia mảng khối text thành các tin nhắn <= TELEGRAM_MAX, không cắt giữa khối. */
    buildMessages(blocks: string[], header: string): string[] {
        const messages: string[] = [];
        let current = header;
        for (const block of blocks) {
            if ((current + '\n\n' + block).length > TELEGRAM_MAX) {
                messages.push(current);
                current = block;
            } else {
                current = current ? current + '\n\n' + block : block;
            }
        }
        if (current) messages.push(current);
        return messages;
    }

    async send(messages: string[]): Promise<{ sent: number }> {
        const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
        const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
        if (!token || !chatId) {
            this.logger.warn('TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID chưa cấu hình — bỏ qua gửi');
            return { sent: 0 };
        }
        let sent = 0;
        for (const text of messages) {
            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
            });
            if (res.ok) sent++;
            else this.logger.error(`Telegram send failed: ${res.status} ${await res.text()}`);
        }
        return { sent };
    }
}
```

- [ ] **Step 2: Thêm `runDailyNotify` vào EventService**

Trong `event.service.ts`, thêm import và inject `TelegramService`, rồi method. Sửa constructor:
```ts
import { TelegramService } from './telegram.service';
import { EventTrigger } from './constants';
// ...
    constructor(
        @InjectModel(Event.name) private readonly eventModel: Model<Event>,
        @InjectModel(Person.name) private readonly personModel: Model<Person>,
        private readonly telegram: TelegramService,
    ) {}
```

Thêm method (cuối class):
```ts
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
```

- [ ] **Step 3: Build kiểm tra biên dịch**

```bash
cd backend && npm run build
```
Expected: build thành công (không lỗi TS).

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/event/telegram.service.ts backend/src/modules/event/event.service.ts
git commit -m "feat(event): add Telegram digest with message splitting"
```

---

## Task 9: EventController + module

**Files:**
- Create: `backend/src/modules/event/event.controller.ts`
- Create: `backend/src/modules/event/event.module.ts`

- [ ] **Step 1: Viết controller**

`event.controller.ts`:
```ts
import {
    Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Headers, UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoles } from '../../constants';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@ApiTags('Event')
@Controller('event')
export class EventController {
    constructor(
        private readonly eventService: EventService,
        private readonly config: ConfigService,
    ) {}

    // Cron — KHÔNG dùng JWT, xác thực bằng CRON_SECRET. Đặt TRƯỚC ':id' route.
    @Get('cron/daily-notify')
    @ApiOperation({ summary: 'Vercel Cron: gửi thông báo Telegram theo ngày' })
    async dailyNotify(@Headers('authorization') auth: string) {
        const secret = this.config.get<string>('CRON_SECRET');
        if (!secret || auth !== `Bearer ${secret}`) {
            throw new UnauthorizedException('Invalid cron secret');
        }
        return this.eventService.runDailyNotify();
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Danh sách event, sort theo ngày sắp tới' })
    findAll() {
        return this.eventService.findAll();
    }

    @Get('notifications')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Event có trigger hôm nay (cho chuông FE)' })
    notifications() {
        return this.eventService.getNotifications();
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
    create(@Body() dto: CreateEventDto) {
        return this.eventService.create(dto);
    }

    @Post('sync-all')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRoles.ADMIN)
    @ApiOperation({ summary: 'Tính lại toàn bộ auto-event từ persons + dọn orphan' })
    syncAll() {
        return this.eventService.syncAll();
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
    update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
        return this.eventService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
    remove(@Param('id') id: string) {
        return this.eventService.remove(id);
    }
}
```

- [ ] **Step 2: Viết module**

`event.module.ts`:
```ts
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
```

- [ ] **Step 3: Build kiểm tra**

```bash
cd backend && npm run build
```
Expected: build thành công.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/event/event.controller.ts backend/src/modules/event/event.module.ts
git commit -m "feat(event): add EventController and EventModule"
```

---

## Task 10: Wire EventModule + PersonService sync

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/modules/person/person.module.ts`
- Modify: `backend/src/modules/person/person.service.ts`

- [ ] **Step 1: Đăng ký EventModule vào AppModule**

Trong `app.module.ts`, thêm import và vào mảng `imports`:
```ts
import { EventModule } from './modules/event/event.module';
```
Thêm `EventModule,` vào danh sách imports (sau `GalleryModule`).

- [ ] **Step 2: PersonModule import EventModule**

Trong `person.module.ts`, thêm:
```ts
import { EventModule } from '../event/event.module';
```
và thêm `EventModule` vào mảng `imports`:
```ts
imports: [MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]), SpouseModule, ParentChildModule, EventModule],
```

- [ ] **Step 3: Inject EventService vào PersonService**

Trong `person.service.ts`, sửa import + constructor:
```ts
import { EventService } from '../event/event.service';
// ...
    constructor(
        @InjectModel(Person.name) private readonly personModel: Model<Person>,
        private readonly spouseService: SpouseService,
        private readonly parentChildService: ParentChildService,
        private readonly eventService: EventService,
    ) {}
```

Trong `create()`, sau dòng `const newPerson = await this.personModel.create(createPersonDto);` thêm:
```ts
            await this.eventService.syncPersonEvents(newPerson);
```
(trước `return newPerson;`)

Trong `update()`, sau khi có `updatedPerson` và trước `return updatedPerson;` thêm:
```ts
            await this.eventService.syncPersonEvents(updatedPerson);
```

Trong `remove()`, sau dòng xóa parent-child (`await this.parentChildService.deleteChildRelationships(id);`) thêm:
```ts
        await this.eventService.removePersonEvents(id);
```

- [ ] **Step 4: Build kiểm tra DI không cycle**

```bash
cd backend && npm run build
```
Expected: build thành công, không lỗi circular dependency.

- [ ] **Step 5: Chạy toàn bộ test backend**

```bash
cd backend && npx jest
```
Expected: tất cả test PASS (gồm eventOccurrence, event.service).

- [ ] **Step 6: Commit**

```bash
git add backend/src/app.module.ts backend/src/modules/person/person.module.ts backend/src/modules/person/person.service.ts
git commit -m "feat(event): wire EventModule and auto-sync from PersonService"
```

---

## Task 11: Vercel Cron config + env

**Files:**
- Modify: `backend/vercel.json`

- [ ] **Step 1: Thêm crons vào vercel.json**

Sửa `backend/vercel.json` thành (thêm khối `crons`):
```json
{
    "version": 2,
    "builds": [
        {
            "src": "src/vercel.ts",
            "use": "@vercel/node"
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "src/vercel.ts",
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        }
    ],
    "crons": [
        {
            "path": "/api/v1/event/cron/daily-notify",
            "schedule": "0 0 * * *"
        }
    ]
}
```

- [ ] **Step 2: Ghi chú env cần đặt trên Vercel (backend project)**

Thêm các biến môi trường trên Vercel Dashboard → Settings → Environment Variables:
- `TELEGRAM_BOT_TOKEN` — token bot Telegram
- `TELEGRAM_CHAT_ID` — id group nhận thông báo
- `CRON_SECRET` — chuỗi bí mật bất kỳ (Vercel tự gắn header `Authorization: Bearer <CRON_SECRET>` khi gọi cron)

(Không commit giá trị thật. Ghi chú này nằm trong plan; có thể thêm vào `backend/.env.example` nếu repo có file đó.)

- [ ] **Step 3: Commit**

```bash
git add backend/vercel.json
git commit -m "feat(event): add Vercel daily cron for Telegram notifications"
```

---

## Task 12: Frontend eventService + hooks

**Files:**
- Create: `frontend/src/services/eventService.ts`
- Create: `frontend/src/hooks/useEvents.ts`

- [ ] **Step 1: Viết eventService (auth-gated)**

`eventService.ts`:
```ts
import api from './api';
import authService from './authService';

export type EventCalendar = 'lunar' | 'solar';
export type EventSourceType = 'death' | 'birth' | 'manual';
export type EventTrigger = '1_month' | '1_week' | 'month_start' | 'week_start' | 'day_of';

export interface FamilyEvent {
    _id: string;
    title: string;
    desc?: string;
    sourceType: EventSourceType;
    sourcePersonId?: string | null;
    calendar: EventCalendar;
    day: number;
    month: number;
    isLeapMonth?: boolean;
    isActive: boolean;
    nextOccurrence?: string | null;
}

export interface EventNotification {
    event: FamilyEvent;
    triggers: EventTrigger[];
    occurrenceSolar: string | null;
    daysUntil: number | null;
}

export interface CreateEventInput {
    title: string;
    desc?: string;
    calendar: EventCalendar;
    day: number;
    month: number;
    isLeapMonth?: boolean;
    isActive?: boolean;
}

const eventService = {
    getAllEvents: async (): Promise<FamilyEvent[]> => {
        if (!authService.isAuthenticated()) return [];
        const res = await api.get('/event');
        return res.data;
    },

    getNotifications: async (): Promise<EventNotification[]> => {
        if (!authService.isAuthenticated()) return [];
        const res = await api.get('/event/notifications');
        return res.data;
    },

    createEvent: async (input: CreateEventInput): Promise<FamilyEvent> => {
        const res = await api.post('/event', input);
        return res.data;
    },

    updateEvent: async (id: string, input: Partial<CreateEventInput>): Promise<FamilyEvent> => {
        const res = await api.patch(`/event/${id}`, input);
        return res.data;
    },

    deleteEvent: async (id: string): Promise<{ message: string }> => {
        const res = await api.delete(`/event/${id}`);
        return res.data;
    },

    syncAll: async (): Promise<{ processed: number; deletedOrphans: number }> => {
        const res = await api.post('/event/sync-all');
        return res.data;
    },
};

export default eventService;
```

- [ ] **Step 2: Viết hooks**

`useEvents.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import eventService from 'src/services/eventService';

export const useEvents = () => {
    return useQuery({
        queryKey: ['events'],
        queryFn: eventService.getAllEvents,
        staleTime: 5 * 60 * 1000,
    });
};

export const useEventNotifications = () => {
    return useQuery({
        queryKey: ['event-notifications'],
        queryFn: eventService.getNotifications,
        staleTime: 5 * 60 * 1000,
    });
};
```

- [ ] **Step 3: Kiểm tra biên dịch FE**

```bash
cd frontend && npx tsc --noEmit
```
Expected: không lỗi liên quan file mới.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/eventService.ts frontend/src/hooks/useEvents.ts
git commit -m "feat(frontend): add event service and React Query hooks"
```

---

## Task 13: Rewire chuông thông báo sang event

**Files:**
- Modify: `frontend/src/components/GioBellIcon/GioBellIcon.tsx`
- Modify: `frontend/src/views/Root/components/TopBar.tsx`
- Delete: `frontend/src/hooks/useGioReminders.ts`

- [ ] **Step 1: Đọc GioBellIcon hiện tại để giữ style**

```bash
cat frontend/src/components/GioBellIcon/GioBellIcon.tsx
```
Mục tiêu: đổi prop từ `reminders: GioReminder[]` sang `notifications: EventNotification[]`, render `title`, ngày dương (`occurrenceSolar`), `daysUntil`, label theo trigger. Giữ nguyên class/màu (ochre, badge đỏ) theo design system.

- [ ] **Step 2: Sửa GioBellIcon dùng EventNotification**

Đổi import + prop type:
```ts
import { EventNotification } from 'src/services/eventService';

interface GioBellIconProps {
    notifications: EventNotification[];
}

export default function GioBellIcon({ notifications }: GioBellIconProps) {
    const count = notifications.length;
    // ... giữ nguyên phần JSX chuông + badge (dùng `count` thay cho reminders.length)
    // Trong dropdown, map `notifications`:
    //   key={n.event._id}
    //   tên: n.event.title
    //   ngày dương: format từ n.occurrenceSolar
    //   "còn N ngày": n.daysUntil
    //   label gấp: n.daysUntil === 0 ? 'Hôm nay' : n.daysUntil === 1 ? 'Ngày mai' : `Còn ${n.daysUntil} ngày`
}
```
(Giữ toàn bộ markup/màu cũ; chỉ thay nguồn dữ liệu và tên trường. Bỏ mọi tham chiếu `gioLunarStr`/`person` cũ, thay bằng `n.event.title` và `occurrenceSolar`.)

- [ ] **Step 3: Sửa TopBar dùng useEventNotifications**

Trong `TopBar.tsx`:
- Bỏ import `useGioReminders` và prop `persons` (nếu không dùng nơi khác trong TopBar).
- Thêm:
```ts
import { useEventNotifications } from 'src/hooks/useEvents';
```
- Thay thân:
```ts
    const { data: notifications = [] } = useEventNotifications();
    // ...
    <GioBellIcon notifications={notifications} />
```
- Nếu `persons` prop chỉ phục vụ chuông, xóa khỏi `TopBarProps` và nơi gọi `TopBar` (tìm bằng grep `<TopBar`). Nếu nơi gọi vẫn truyền `persons` cho mục đích khác thì giữ.

- [ ] **Step 4: Cập nhật nơi gọi TopBar**

```bash
grep -rn "<TopBar" frontend/src
```
Sửa props cho khớp (bỏ `persons` nếu đã xóa khỏi interface).

- [ ] **Step 5: Xóa hook cũ**

```bash
git rm frontend/src/hooks/useGioReminders.ts
```

- [ ] **Step 6: Kiểm tra biên dịch + grep sạch tham chiếu cũ**

```bash
cd frontend && npx tsc --noEmit
grep -rn "useGioReminders\|gioReminders\|GioReminder" frontend/src
```
Expected: tsc không lỗi; grep không còn kết quả trong `src` (trừ tên file component GioBellIcon nếu giữ tên).

- [ ] **Step 7: Commit**

```bash
git add -A frontend/src/components/GioBellIcon frontend/src/views/Root/components/TopBar.tsx
git commit -m "feat(frontend): switch notification bell to event notifications"
```

---

## Task 14: Trang /events (list + CRUD + recompute)

**Files:**
- Create: `frontend/src/views/Events/EventsView.tsx`
- Create: `frontend/src/app/events/page.tsx`
- Modify: `frontend/src/views/Root/components/TopBar.tsx` (thêm link /events khi đã login)

- [ ] **Step 1: Tạo route**

`frontend/src/app/events/page.tsx`:
```tsx
import EventsView from 'src/views/Events/EventsView';

export default function EventsPage() {
    return <EventsView />;
}
```

- [ ] **Step 2: Tạo EventsView**

`frontend/src/views/Events/EventsView.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEvents } from 'src/hooks/useEvents';
import eventService, { FamilyEvent, CreateEventInput } from 'src/services/eventService';
import { useAuth } from 'src/context/AuthContext';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function typeLabel(e: FamilyEvent): string {
    if (e.sourceType === 'death') return 'Giỗ';
    if (e.sourceType === 'birth') return 'Sinh nhật';
    return 'Lễ / Khác';
}

export default function EventsView() {
    const { data: events = [], isLoading } = useEvents();
    const { isAdmin, isEditor } = useAuth();
    const canEdit = isAdmin || isEditor;
    const queryClient = useQueryClient();

    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState<string | null>(null);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['events'] });

    const handleSyncAll = async () => {
        if (!confirm('Tính lại toàn bộ giỗ & sinh nhật từ danh sách thành viên?')) return;
        setSyncing(true);
        setSyncMsg(null);
        try {
            const res = await eventService.syncAll();
            setSyncMsg(`Đã xử lý ${res.processed} thành viên, xóa ${res.deletedOrphans} event thừa.`);
            refresh();
        } catch (e: any) {
            setSyncMsg('Lỗi: ' + (e?.response?.data?.message || e.message));
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa sự kiện này?')) return;
        await eventService.deleteEvent(id);
        refresh();
    };

    return (
        <div className="min-h-screen px-4 py-6 md:px-8" style={{ backgroundColor: '#fffaf0' }}>
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-5">
                    <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#0a0a0a' }}>
                        Lịch sự kiện
                    </h1>
                    {isAdmin && (
                        <button
                            onClick={handleSyncAll}
                            disabled={syncing}
                            className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            style={{ backgroundColor: '#0a0a0a' }}
                        >
                            {syncing ? 'Đang tính...' : 'Tính lại giỗ & sinh nhật'}
                        </button>
                    )}
                </div>

                {syncMsg && (
                    <div className="mb-4 rounded-[12px] border px-4 py-3 text-sm" style={{ borderColor: '#e5e5e5', color: '#3a3a3a' }}>
                        {syncMsg}
                    </div>
                )}

                {canEdit && <EventForm onSaved={refresh} />}

                {isLoading ? (
                    <p style={{ color: '#6a6a6a' }}>Đang tải...</p>
                ) : (
                    <ul className="space-y-2 mt-4">
                        {events.map((e) => (
                            <li
                                key={e._id}
                                className="flex items-center justify-between rounded-[16px] border px-4 py-3"
                                style={{ backgroundColor: '#fffaf0', borderColor: '#e5e5e5' }}
                            >
                                <div>
                                    <div className="font-medium" style={{ color: '#0a0a0a' }}>{e.title}</div>
                                    <div className="text-[13px]" style={{ color: '#6a6a6a' }}>
                                        {typeLabel(e)} · {e.day}/{e.month}{e.isLeapMonth ? ' (nhuận)' : ''} {e.calendar === 'lunar' ? 'ÂL' : 'DL'}
                                        {!e.isActive && ' · (tắt)'}
                                    </div>
                                </div>
                                {canEdit && (
                                    <button onClick={() => handleDelete(e._id)} className="text-[13px]" style={{ color: '#ff4d8b' }}>
                                        Xóa
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function EventForm({ onSaved }: { onSaved: () => void }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [calendar, setCalendar] = useState<'lunar' | 'solar'>('lunar');
    const [day, setDay] = useState(1);
    const [month, setMonth] = useState(1);
    const [isLeapMonth, setIsLeapMonth] = useState(false);
    const [saving, setSaving] = useState(false);

    const submit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setSaving(true);
        try {
            const input: CreateEventInput = { title, calendar, day, month, isLeapMonth: calendar === 'lunar' ? isLeapMonth : false };
            await eventService.createEvent(input);
            setTitle('');
            setOpen(false);
            onSaved();
        } finally {
            setSaving(false);
        }
    };

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="rounded-[12px] border px-4 py-2.5 text-sm font-medium" style={{ borderColor: '#e5e5e5', color: '#3a3a3a' }}>
                + Thêm sự kiện
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="rounded-[16px] border p-4 space-y-3" style={{ borderColor: '#e5e5e5' }}>
            <input
                required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên sự kiện"
                className="w-full rounded-[12px] border px-4 py-3 text-sm" style={{ backgroundColor: '#fffaf0', borderColor: '#e5e5e5' }}
            />
            <div className="flex gap-3 flex-wrap">
                <select value={calendar} onChange={(e) => setCalendar(e.target.value as any)} className="rounded-[12px] border px-3 py-2.5 text-sm" style={{ borderColor: '#e5e5e5' }}>
                    <option value="lunar">Âm lịch</option>
                    <option value="solar">Dương lịch</option>
                </select>
                <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="rounded-[12px] border px-3 py-2.5 text-sm" style={{ borderColor: '#e5e5e5' }}>
                    {DAYS.map((d) => <option key={d} value={d}>Ngày {d}</option>)}
                </select>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-[12px] border px-3 py-2.5 text-sm" style={{ borderColor: '#e5e5e5' }}>
                    {MONTHS.map((m) => <option key={m} value={m}>Tháng {m}</option>)}
                </select>
                {calendar === 'lunar' && (
                    <label className="flex items-center gap-1.5 text-sm" style={{ color: '#3a3a3a' }}>
                        <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} /> Nhuận
                    </label>
                )}
            </div>
            <div className="flex gap-2">
                <button type="submit" disabled={saving} className="rounded-[12px] px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: '#0a0a0a' }}>
                    {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="rounded-[12px] border px-4 py-2.5 text-sm" style={{ borderColor: '#e5e5e5' }}>
                    Hủy
                </button>
            </div>
        </form>
    );
}
```

- [ ] **Step 3: Thêm link "Lịch sự kiện" vào TopBar (khi đã login)**

Trong `TopBar.tsx`, cạnh link `/persons` (trong khối `{user && (...)}`), thêm một `<Link href="/events">` tương tự, nhãn "Sự kiện". Giữ style giống link Danh sách.

- [ ] **Step 4: Kiểm tra biên dịch + chạy dev**

```bash
cd frontend && npx tsc --noEmit && npm run build
```
Expected: build thành công.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/Events frontend/src/app/events frontend/src/views/Root/components/TopBar.tsx
git commit -m "feat(frontend): add /events page with CRUD and recompute button"
```

---

## Task 15: Kiểm thử tích hợp thủ công

**Files:** (không sửa code; ghi kết quả)

- [ ] **Step 1: Backend test toàn bộ**

```bash
cd backend && npx jest && npm run build
```
Expected: tất cả PASS, build OK.

- [ ] **Step 2: Smoke test local (nếu chạy được Mongo + backend)**

Khởi động backend (`docker-compose up` cho Mongo, `npm run start:dev`). Sau đó:
- `POST /api/v1/event/sync-all` (token admin) → trả `{ processed, deletedOrphans }`, kiểm tra collection `events` có giỗ/sinh nhật cho persons có death/birth.
- Sửa 1 person thêm `death` + `isDead=true` → kiểm tra có event giỗ mới.
- `GET /api/v1/event` → list sort theo ngày sắp tới.
- `GET /api/v1/event/notifications` → đúng các event có trigger hôm nay.
- `GET /api/v1/event/cron/daily-notify` không header → 401; với header `Authorization: Bearer <CRON_SECRET>` → chạy (nếu chưa cấu hình Telegram thì `sent: 0`, không crash).

- [ ] **Step 3: FE smoke test**

`npm run dev` frontend, đăng nhập admin:
- Vào `/events`: thấy list, thêm 1 lễ âm lịch, bấm "Tính lại giỗ & sinh nhật" → thấy thống kê.
- Chuông TopBar: hiển thị event có trigger hôm nay (nếu có), guest chưa-login không thấy event.

- [ ] **Step 4: Commit (nếu có chỉnh sửa nhỏ phát sinh)**

```bash
git add -A && git commit -m "test(event): manual integration verification fixes" || echo "no changes"
```

---

## Self-Review Notes

- **Spec coverage:** CRUD manual (T6/T9/T14), auto-sync death/birth (T7/T10), recompute button + orphan cleanup (T7/T9/T14), calendar lunar/solar field (T5/T6), 5 mốc dùng chung (T4/T8/T13), Telegram digest + split (T8), Vercel cron + CRON_SECRET (T9/T11), event yêu cầu login + guest không thấy (T9 guards / T12 auth-gate), sort theo ngày-trong-năm (T7 findAll), không đụng bảng cũ (collection mới, chỉ thêm lời gọi trong PersonService).
- **Auto-event chỉ sửa desc/isActive:** enforced trong `EventService.update` (T7).
- **Cron path** dùng global prefix `/api/v1/...` (T11) khớp `setGlobalPrefix('api/v1')`.
- **Tránh circular DI:** EventModule không import PersonModule; chỉ PersonModule import EventModule (T9/T10).
