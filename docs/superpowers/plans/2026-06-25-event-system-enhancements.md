# Event System Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tinh chỉnh Event System: title giỗ theo giới tính + ngày âm, bộ mốc nhắc mới (tách FE 30 ngày / Telegram 4 mốc + icon), đồng bộ 1 người, UI /events & /persons, và toast react-toastify.

**Architecture:** Backend đổi `EventTrigger` + tách `getNotifications` (chuông, 30 ngày) khỏi `runDailyNotify` (Telegram, theo mốc); thêm `syncOnePerson` + route. Frontend thêm toastify hạ tầng, nút refresh/push gọi `syncPerson`, đổi màu card.

**Tech Stack:** NestJS + Mongoose + lunar-javascript; Next.js + React Query + react-toastify.

**Spec:** `docs/superpowers/specs/2026-06-25-event-system-enhancements-design.md`

**Nhánh:** tiếp tục trên `feature/event-system`.

---

## File Structure

**Backend (Modify):**
- `backend/src/modules/event/constants.ts` — đổi enum `EventTrigger`
- `backend/src/modules/event/utils/eventOccurrence.ts` + `.spec.ts` — `getActiveTriggers` 4 mốc
- `backend/src/modules/event/event.service.ts` + `.spec.ts` — title, getNotifications, runDailyNotify, triggerLabel, syncOnePerson
- `backend/src/modules/event/event.controller.ts` — route `sync-person/:personId`

**Frontend:**
- `frontend/package.json` — thêm `react-toastify`
- `frontend/src/components/Providers.tsx` — `<ToastContainer/>`
- `frontend/src/services/eventService.ts` — `syncPerson` + type
- `frontend/src/views/Events/EventsView.tsx` — card màu, nút refresh, toast
- `frontend/src/views/Persons/PersonsView.tsx` + `components/PersonList.tsx` — nút push + toast

---

## Task 1: Backend — bộ mốc nhắc mới + tách FE/Telegram

**Files:**
- Modify: `backend/src/modules/event/constants.ts`
- Modify: `backend/src/modules/event/utils/eventOccurrence.ts`
- Modify: `backend/src/modules/event/utils/eventOccurrence.spec.ts`
- Modify: `backend/src/modules/event/event.service.ts`

- [ ] **Step 1: Cập nhật test occurrence trước (đỏ)**

Trong `eventOccurrence.spec.ts`, trong `describe('getActiveTriggers (solar)', ...)`: **XÓA** test `it('fires month_start on the 1st of the occurrence month', ...)` và **THÊM** test mới:
```ts
    it('fires 1_day exactly one day before', () => {
        const t = getActiveTriggers(solarEvent, new Date(2026, 5, 14));
        expect(t).toContain(EventTrigger.ONE_DAY);
    });

    it('does not fire month_start/week_start anymore (only 4 triggers exist)', () => {
        // 1st of June 2026 is NOT 1 month / 1 week / 1 day / day_of before 15 Jun → empty
        const t = getActiveTriggers(solarEvent, new Date(2026, 5, 1));
        expect(t).toEqual([]);
    });
```
Giữ nguyên các test `day_of`, `1_week`, `1_month`, `returns empty`, và test day-31 1_month.

- [ ] **Step 2: Chạy test → đỏ**

Run: `cd D:/MyProject/family-tree/backend && npx jest eventOccurrence`
Expected: FAIL (`EventTrigger.ONE_DAY` chưa tồn tại / month_start vẫn fire).

- [ ] **Step 3: Đổi enum trong `constants.ts`**

Thay khối `export enum EventTrigger { ... }` thành:
```ts
export enum EventTrigger {
    ONE_MONTH = '1_month',
    ONE_WEEK = '1_week',
    ONE_DAY = '1_day',
    DAY_OF = 'day_of',
}
```

- [ ] **Step 4: Sửa `getActiveTriggers` trong `eventOccurrence.ts`**

Thay thân hàm `getActiveTriggers` (phần đẩy triggers) thành đúng 4 mốc:
```ts
export function getActiveTriggers(ev: OccurrenceInput, today: Date): EventTrigger[] {
    const t = startOfDay(today);
    const occ = nextOccurrence(ev, t);
    if (!occ) return [];

    const triggers: EventTrigger[] = [];
    if (sameDay(t, occ)) triggers.push(EventTrigger.DAY_OF);
    if (sameDay(t, addDays(occ, -1))) triggers.push(EventTrigger.ONE_DAY);
    if (sameDay(t, addDays(occ, -7))) triggers.push(EventTrigger.ONE_WEEK);
    if (sameDay(t, monthsBefore(occ, 1))) triggers.push(EventTrigger.ONE_MONTH);
    return triggers;
}
```
(Bỏ 2 dòng `MONTH_START`/`WEEK_START`. Giữ nguyên `monthsBefore`, `mondayOf` có thể còn nhưng không dùng — để nguyên, không bắt buộc xóa.)

- [ ] **Step 5: Sửa `event.service.ts` — triggerLabel + getNotifications + runDailyNotify**

Thay `triggerLabel`:
```ts
    private triggerLabel(t: EventTrigger): string {
        switch (t) {
            case EventTrigger.DAY_OF: return '🔔 HÔM NAY';
            case EventTrigger.ONE_DAY: return 'Còn 1 ngày';
            case EventTrigger.ONE_WEEK: return 'Còn 1 tuần';
            case EventTrigger.ONE_MONTH: return 'Còn 1 tháng';
            default: return '';
        }
    }
```

Thay `getNotifications` (chuông FE — cửa sổ 30 ngày, không lọc theo mốc, bỏ `triggers`):
```ts
    async getNotifications(): Promise<any[]> {
        const today = new Date();
        const events = await this.eventModel.find({ isActive: true }).lean().exec();
        const result = [];
        for (const e of events) {
            const occ = nextOccurrence(e as any, today);
            if (!occ) continue;
            const d = daysUntil(occ, today);
            if (d < 0 || d > 30) continue;
            result.push({ event: e, occurrenceSolar: occ, daysUntil: d });
        }
        result.sort((a, b) => a.daysUntil - b.daysUntil);
        return result;
    }
```

Thay `runDailyNotify` (Telegram — tự tính trigger, thêm icon loại):
```ts
    async runDailyNotify(): Promise<{ events: number; sent: number }> {
        const today = new Date();
        const events = await this.eventModel.find({ isActive: true }).lean().exec();
        const ICON: Record<string, string> = { death: '🕯️', birth: '🎂', manual: '📅' };

        const blocks: string[] = [];
        for (const e of events) {
            const triggers = getActiveTriggers(e as any, today);
            if (triggers.length === 0) continue;
            const occ = nextOccurrence(e as any, today);
            const occStr = occ ? `${occ.getDate()}/${occ.getMonth() + 1}/${occ.getFullYear()}` : '';
            const d = occ ? daysUntil(occ, today) : null;
            const labels = triggers.map((t) => this.triggerLabel(t)).filter(Boolean).join(' · ');
            const icon = ICON[(e as any).sourceType] ?? '📅';
            blocks.push(`${icon} <b>${(e as any).title}</b>\nNgày: ${occStr} (còn ${d} ngày)\n${labels}`);
        }
        if (blocks.length === 0) return { events: 0, sent: 0 };

        const header = `📅 <b>Lịch sự kiện dòng họ — ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}</b>`;
        const messages = this.telegram.buildMessages(blocks, header);
        const { sent } = await this.telegram.send(messages);
        return { events: blocks.length, sent };
    }
```

- [ ] **Step 6: Chạy test + build → xanh**

Run: `cd D:/MyProject/family-tree/backend && npx jest eventOccurrence event.service && npm run build`
Expected: tất cả PASS, build OK (không còn tham chiếu `WEEK_START`/`MONTH_START`).

- [ ] **Step 7: Commit**

```bash
cd D:/MyProject/family-tree/backend
git add src/modules/event/constants.ts src/modules/event/utils/eventOccurrence.ts src/modules/event/utils/eventOccurrence.spec.ts src/modules/event/event.service.ts
git commit -m "feat(event): new reminder triggers (1m/1w/1d/day-of), 30-day FE feed, telegram icons"
```

---

## Task 2: Backend — title giỗ theo giới tính + ngày âm

**Files:**
- Modify: `backend/src/modules/event/event.service.ts`
- Modify: `backend/src/modules/event/event.service.spec.ts`

- [ ] **Step 1: Cập nhật test title (đỏ)**

Trong `event.service.spec.ts`, test `'upserts a death (giỗ, lunar) event ...'`: thêm `gender: 1` vào person và đổi assert title:
```ts
    it('upserts a death (giỗ, lunar) event when person is dead with death date', async () => {
        await service.syncPersonEvents({
            _id: 'p1', name: 'Ông A', gender: 1, isDead: true, death: new Date(2020, 2, 10), birth: null,
        } as any);

        const deathCall = eventModel.updateOne.mock.calls.find(
            (c: any[]) => c[0].sourceType === EventSourceType.DEATH,
        );
        expect(deathCall).toBeDefined();
        expect(deathCall[0]).toEqual({ sourceType: EventSourceType.DEATH, sourcePersonId: 'p1' });
        expect(deathCall[1].$set.calendar).toBe('lunar');
        expect(deathCall[1].$set.title).toMatch(/^Giỗ bà Ông A \(\d{1,2}\/\d{1,2}( nhuận)?\)$/);
    });
```
(Title sinh nhật giữ nguyên `Sinh nhật Ông A` ở test thứ 2 — không đổi.)

- [ ] **Step 2: Chạy test → đỏ**

Run: `cd D:/MyProject/family-tree/backend && npx jest event.service`
Expected: FAIL test title giỗ (vẫn là `Giỗ Ông A`).

- [ ] **Step 3: Sửa `syncPersonEvents` — nhánh giỗ**

Trong `event.service.ts`, thay khối tạo giỗ (phần `if (person.isDead && person.death)`):
```ts
        if (person.isDead && person.death) {
            const parts = solarToLunarParts(new Date(person.death));
            const honorific = person.gender === 1 ? 'bà' : 'ông';
            const leap = parts.isLeapMonth ? ' nhuận' : '';
            await this.eventModel.updateOne(
                { sourceType: EventSourceType.DEATH, sourcePersonId: pid },
                {
                    $set: {
                        calendar: EventCalendar.LUNAR,
                        day: parts.day,
                        month: parts.month,
                        isLeapMonth: parts.isLeapMonth,
                        title: `Giỗ ${honorific} ${person.name} (${parts.day}/${parts.month}${leap})`,
                    },
                    $setOnInsert: { isActive: true },
                },
                { upsert: true },
            );
        } else {
```
(Nhánh sinh nhật giữ nguyên `title: \`Sinh nhật ${person.name}\``.)

- [ ] **Step 4: Chạy test → xanh**

Run: `cd D:/MyProject/family-tree/backend && npx jest event.service`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd D:/MyProject/family-tree/backend
git add src/modules/event/event.service.ts src/modules/event/event.service.spec.ts
git commit -m "feat(event): giỗ title with ông/bà honorific and lunar date"
```

---

## Task 3: Backend — đồng bộ 1 người (sync-person)

**Files:**
- Modify: `backend/src/modules/event/event.service.ts`
- Modify: `backend/src/modules/event/event.service.spec.ts`
- Modify: `backend/src/modules/event/event.controller.ts`

- [ ] **Step 1: Viết test (đỏ)**

Thêm vào cuối `event.service.spec.ts`:
```ts
describe('EventService.syncOnePerson', () => {
    const validId = '507f1f77bcf86cd799439011';

    const build = async (eventModel: any, personModel: any) => {
        const { Test } = await import('@nestjs/testing');
        const { getModelToken } = await import('@nestjs/mongoose');
        const moduleRef = await Test.createTestingModule({
            providers: [
                EventService,
                { provide: getModelToken(Event.name), useValue: eventModel },
                { provide: getModelToken(Person.name), useValue: personModel },
                { provide: TelegramService, useValue: { buildMessages: jest.fn(() => []), send: jest.fn().mockResolvedValue({ sent: 0 }) } },
            ],
        }).compile();
        return moduleRef.get(EventService);
    };

    it('throws when person not found', async () => {
        const personModel = { findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) };
        const service = await build({}, personModel);
        await expect(service.syncOnePerson(validId)).rejects.toThrow();
    });

    it('syncs and returns ok when person found', async () => {
        const person = { _id: validId, name: 'A', gender: 0, isDead: false, death: null, birth: null };
        const eventModel = { updateOne: jest.fn().mockResolvedValue({}), deleteOne: jest.fn().mockResolvedValue({}) };
        const personModel = { findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(person) }) };
        const service = await build(eventModel, personModel);
        const res = await service.syncOnePerson(validId);
        expect(res).toEqual({ ok: true });
        expect(personModel.findById).toHaveBeenCalledWith(validId);
    });
});
```

- [ ] **Step 2: Chạy test → đỏ**

Run: `cd D:/MyProject/family-tree/backend && npx jest event.service`
Expected: FAIL (`syncOnePerson` chưa tồn tại).

- [ ] **Step 3: Thêm `syncOnePerson` vào `event.service.ts`**

Thêm method (đặt ngay sau `removePersonEvents`):
```ts
    async syncOnePerson(personId: string): Promise<{ ok: true }> {
        if (!Types.ObjectId.isValid(personId)) throw new NotFoundException(`Invalid person ID: ${personId}`);
        const person = await this.personModel.findById(personId).exec();
        if (!person) throw new NotFoundException(`Person ${personId} not found`);
        await this.syncPersonEvents(person);
        return { ok: true };
    }
```

- [ ] **Step 4: Thêm route vào `event.controller.ts`**

Ngay sau method `syncAll()` (cùng nhóm path tĩnh, trước `@Patch(':id')`):
```ts
    @Post('sync-person/:personId')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
    @ApiOperation({ summary: 'Đồng bộ giỗ & sinh nhật cho 1 người' })
    syncPerson(@Param('personId') personId: string) {
        return this.eventService.syncOnePerson(personId);
    }
```

- [ ] **Step 5: Chạy test + build → xanh**

Run: `cd D:/MyProject/family-tree/backend && npx jest event.service && npm run build`
Expected: PASS + build OK.

- [ ] **Step 6: Commit**

```bash
cd D:/MyProject/family-tree/backend
git add src/modules/event/event.service.ts src/modules/event/event.service.spec.ts src/modules/event/event.controller.ts
git commit -m "feat(event): add POST /event/sync-person/:personId to sync one person"
```

---

## Task 4: Frontend — react-toastify hạ tầng

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/components/Providers.tsx`

- [ ] **Step 1: Cài react-toastify**

Run: `cd D:/MyProject/family-tree/frontend && npm install react-toastify`

- [ ] **Step 2: Thêm ToastContainer vào Providers**

Thay toàn bộ `frontend/src/components/Providers.tsx`:
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar newestOnTop theme="light" />
        </QueryClientProvider>
    );
}
```

- [ ] **Step 3: Build kiểm tra**

Run: `cd D:/MyProject/family-tree/frontend && npx tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 4: Commit**

```bash
cd D:/MyProject/family-tree/frontend
git add package.json package-lock.json yarn.lock src/components/Providers.tsx
git commit -m "feat(frontend): integrate react-toastify (ToastContainer in Providers)"
```
(Nếu `yarn.lock` không đổi thì bỏ khỏi `git add`.)

---

## Task 5: Frontend — eventService.syncPerson + type

**Files:**
- Modify: `frontend/src/services/eventService.ts`

- [ ] **Step 1: Thêm method + nới type**

Trong `eventService.ts`:
1. Đổi `EventNotification.triggers` thành optional:
```ts
export interface EventNotification {
    event: FamilyEvent;
    triggers?: EventTrigger[];
    occurrenceSolar: string | null;
    daysUntil: number | null;
}
```
2. Thêm method vào object `eventService` (sau `syncAll`):
```ts
    syncPerson: async (personId: string): Promise<{ ok: true }> => {
        const res = await api.post(`/event/sync-person/${personId}`);
        return res.data;
    },
```

- [ ] **Step 2: Build kiểm tra**

Run: `cd D:/MyProject/family-tree/frontend && npx tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 3: Commit**

```bash
cd D:/MyProject/family-tree/frontend
git add src/services/eventService.ts
git commit -m "feat(frontend): eventService.syncPerson + optional triggers type"
```

---

## Task 6: Frontend — /events: card màu + nút refresh + toast

**Files:**
- Modify: `frontend/src/views/Events/EventsView.tsx`

- [ ] **Step 1: Thêm import toast + bỏ state syncMsg**

Ở đầu file thêm: `import { toast } from 'react-toastify';`

Xóa dòng `const [syncMsg, setSyncMsg] = useState<string | null>(null);`

- [ ] **Step 2: Đổi requestSyncAll dùng toast**

Thay `run` trong `requestSyncAll` (bỏ setSyncMsg):
```ts
            run: async () => {
                setSyncing(true);
                try {
                    const res = await eventService.syncAll();
                    toast.success(`Đã đồng bộ ${res.processed} thành viên · dọn ${res.deletedOrphans} sự kiện thừa.`);
                    refresh();
                } catch (e: any) {
                    toast.error('Lỗi: ' + (e?.response?.data?.message || e.message));
                } finally {
                    setSyncing(false);
                }
            },
```

- [ ] **Step 3: Thêm toast vào delete + handler refresh mới**

Thay `run` trong `requestDelete`:
```ts
            run: async () => {
                await eventService.deleteEvent(event._id);
                toast.success('Đã xóa sự kiện');
                refresh();
            },
```
Thêm handler refresh (đặt cạnh `handleToggle`):
```ts
    const handleRefresh = async (e: FamilyEvent) => {
        if (!e.sourcePersonId) return;
        setBusyId(e._id);
        try {
            await eventService.syncPerson(e.sourcePersonId);
            toast.success('Đã cập nhật từ hồ sơ thành viên');
            refresh();
        } catch (err: any) {
            toast.error('Lỗi: ' + (err?.response?.data?.message || err.message));
        } finally {
            setBusyId(null);
        }
    };
```
Cập nhật `handleToggle` để báo toast:
```ts
    const handleToggle = async (e: FamilyEvent) => {
        setBusyId(e._id);
        try {
            await eventService.updateEvent(e._id, { isActive: !e.isActive });
            toast.success(e.isActive ? 'Đã tắt thông báo' : 'Đã bật thông báo');
            refresh();
        } finally {
            setBusyId(null);
        }
    };
```

- [ ] **Step 4: Bỏ banner syncMsg trong JSX**

Xóa khối JSX:
```tsx
                {syncMsg && (
                    <div
                        className="mt-4 rounded-[12px] border px-4 py-3 text-[13px]"
                        style={{ borderColor: '#e8b94a', backgroundColor: 'rgba(232,185,74,0.10)', color: '#7a5e15' }}
                    >
                        {syncMsg}
                    </div>
                )}
```

- [ ] **Step 5: Truyền onRefresh xuống EventCard**

Trong vòng map render `<EventCard ... />`, thêm prop:
```tsx
                                    onToggle={() => handleToggle(e)}
                                    onRefresh={() => handleRefresh(e)}
                                    onDelete={() => requestDelete(e)}
```

- [ ] **Step 6: Cập nhật EventCard — màu card + nút refresh**

Trong `EventCard`:
1. Đổi nền card (thuộc tính `style` của `<li>`): `backgroundColor: '#fffefb'` (thay `'#fffaf0'`).
2. Thêm prop `onRefresh: () => void` vào kiểu props của `EventCard`.
3. Trong cụm nút (block `{canEdit && (<div className="flex items-center gap-1">...`), thêm nút refresh TRƯỚC nút toggle, chỉ khi là auto-event:
```tsx
                        {event.sourceType !== 'manual' && (
                            <button
                                onClick={onRefresh}
                                disabled={busy}
                                title="Cập nhật lại từ hồ sơ thành viên"
                                aria-label="Cập nhật lại từ hồ sơ"
                                className="flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors hover:bg-[#eef3f1] disabled:opacity-50"
                                style={{ color: '#1a3a3a' }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} stroke="currentColor" strokeWidth={1.8}>
                                    <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8M20 12a8 8 0 0 1-13.7 5.7L4 16" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M20 4v4h-4M4 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        )}
```
(Cập nhật signature `function EventCard({ event, canEdit, busy, onToggle, onRefresh, onDelete }: {...; onRefresh: () => void; ...})`.)

- [ ] **Step 7: Thêm toast khi tạo event (EventForm)**

Trong `EventForm.submit`, sau `await eventService.createEvent(input);` thêm `toast.success('Đã thêm sự kiện');`. (toast đã import ở đầu file.)

- [ ] **Step 8: Build kiểm tra**

Run: `cd D:/MyProject/family-tree/frontend && npx tsc --noEmit && npm run build`
Expected: tsc sạch, build OK, route `/events` build thành công.

- [ ] **Step 9: Commit**

```bash
cd D:/MyProject/family-tree/frontend
git add src/views/Events/EventsView.tsx
git commit -m "feat(frontend): events page — warm card, per-auto refresh button, toasts"
```

---

## Task 7: Frontend — /persons: nút push sự kiện + toast

**Files:**
- Modify: `frontend/src/views/Persons/components/PersonList.tsx`
- Modify: `frontend/src/views/Persons/PersonsView.tsx`

- [ ] **Step 1: PersonList — thêm prop + cột hành động**

Trong `PersonList.tsx`:
1. Thêm vào `PersonListProps`:
```ts
    canEdit: boolean;
    onPushEvent: (person: Person) => void;
```
2. Thêm vào tham số destructure: `canEdit, onPushEvent`.
3. Trong `<thead><tr>`, sau cột CCCD `<th>`, thêm (chỉ khi canEdit):
```tsx
                        {canEdit && (
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                Sự kiện
                            </th>
                        )}
```
4. Trong `<tbody>` mỗi `<tr>`, sau cột CCCD `<td>`, thêm:
```tsx
                                {canEdit && (
                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                        <button
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                onPushEvent(person);
                                            }}
                                            title="Tạo/cập nhật sự kiện giỗ & sinh nhật"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.8}>
                                                <path d="M8 2v3M16 2v3M3.5 9h17M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 13v3M10.5 14.5h3" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    </td>
                                )}
```

- [ ] **Step 2: PersonsView — handler + truyền props**

Trong `PersonsView.tsx`:
1. Thêm imports:
```ts
import { toast } from 'react-toastify';
import eventService from 'src/services/eventService';
```
2. Thêm handler (cạnh các handler khác):
```ts
    const handlePushEvent = useCallback(async (person: Person) => {
        if (!person._id) return;
        try {
            await eventService.syncPerson(person._id);
            toast.success(`Đã cập nhật sự kiện cho ${person.name}`);
        } catch (e: any) {
            toast.error('Lỗi: ' + (e?.response?.data?.message || e.message));
        }
    }, []);
```
3. Truyền props vào `<PersonList ... />`:
```tsx
                        onPersonClick={handlePersonClick}
                        canEdit={isAdmin || isEditor}
                        onPushEvent={handlePushEvent}
```

- [ ] **Step 3: Build kiểm tra**

Run: `cd D:/MyProject/family-tree/frontend && npx tsc --noEmit && npm run build`
Expected: tsc sạch, build OK.

- [ ] **Step 4: Commit**

```bash
cd D:/MyProject/family-tree/frontend
git add src/views/Persons/components/PersonList.tsx src/views/Persons/PersonsView.tsx
git commit -m "feat(frontend): persons list push-event button + toast"
```

---

## Task 8: Kiểm thử tích hợp

- [ ] **Step 1: Backend test + build**

Run: `cd D:/MyProject/family-tree/backend && npx jest eventOccurrence event.service && npm run build`
Expected: tất cả PASS, build OK.

- [ ] **Step 2: Frontend build**

Run: `cd D:/MyProject/family-tree/frontend && npx tsc --noEmit && npm run build`
Expected: tsc sạch, build OK (routes `/events`, `/persons`).

- [ ] **Step 3: Smoke test thủ công (nếu chạy local)**

- `/persons`: bấm nút lịch ở 1 hàng → toast "Đã cập nhật sự kiện cho …"; kiểm tra `/events` có giỗ/sinh nhật của người đó.
- `/events`: bấm refresh trên 1 giỗ → toast; title đổi sang dạng `Giỗ bà X (18/5)`. Đổi nền card sang `#fffefb`. Thêm/xóa/toggle → toast.
- Telegram: chờ cron (hoặc gọi thủ công `GET /api/v1/event/cron/daily-notify` kèm `Authorization: Bearer <CRON_SECRET>`) → message có icon 🕯️/🎂 trước tên, mốc đúng 4 loại.

- [ ] **Step 4: Commit (nếu có sửa nhỏ)**

```bash
cd D:/MyProject/family-tree && git add -A && git commit -m "test(event): manual verification fixes" || echo "no changes"
```

---

## Self-Review Notes

- **Spec coverage:** title gender+lunar (T2), 4 mốc + FE 30 ngày + Telegram icon (T1), sync-person endpoint (T3), toastify (T4), eventService.syncPerson + type (T5), /events card #fffefb + refresh (T6), /persons push (T7).
- **Build-green ordering:** enum đổi cùng triggerLabel/runDailyNotify trong T1 nên không vỡ compile giữa các task. `getNotifications` bỏ `triggers` — FE `EventNotification.triggers` thành optional (T5); GioBellIcon không dùng `triggers`.
- **Type consistency:** `syncPerson` trả `{ ok: true }` ở BE (T3) và FE (T5). `onRefresh`/`onPushEvent` props khớp nơi định nghĩa và nơi gọi.
- **Lưu ý:** title cũ chỉ đổi khi sync lại (refresh/push/sync-all).
