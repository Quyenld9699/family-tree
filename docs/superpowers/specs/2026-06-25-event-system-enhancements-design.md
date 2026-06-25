# Thiết kế: Cải tiến Event System (đợt 2)

> Ngày: 2026-06-25
> Trạng thái: Đã chốt thiết kế, chờ review spec → viết plan
> Tiền đề: nối tiếp `2026-06-23-event-system-design.md` (đã triển khai trên nhánh `feature/event-system`).

## Mục tiêu

6 cải tiến sau khi bot Telegram đã chạy đúng:

1. Title auto-event chi tiết hơn (giới tính + ngày âm cho giỗ).
2. Đổi bộ mốc nhắc; tách logic chuông FE và Telegram.
3. Icon loại sự kiện trước title trong tin Telegram.
4. Nút refresh từng auto-event ở trang `/events`.
5. Card sự kiện nền ấm nhẹ (tách khỏi nền trang).
6. Nút "push sự kiện" mỗi người ở trang `/persons`.
7. (Hạ tầng) Thông báo kết quả hành động bằng **react-toastify**.

## Quyết định đã chốt

| Vấn đề | Lựa chọn |
|---|---|
| Title giỗ | `Giỗ {ông\|bà} {name} ({day}/{month}[ nhuận])` — ngày âm, honorific theo `gender` |
| Title sinh nhật | Giữ `Sinh nhật {name}` (chỉ tên) |
| Mốc nhắc | 4 mốc: `ONE_MONTH`, `ONE_WEEK`, `ONE_DAY`, `DAY_OF` (bỏ `MONTH_START`, `WEEK_START`) |
| Chuông FE | Danh sách **30 ngày** (mọi event sắp tới), không lọc theo mốc |
| Telegram | Lọc theo 4 mốc; mỗi dòng có icon loại trước title |
| Đồng bộ 1 người | `POST /event/sync-person/:personId` (admin, editor) |
| Màu card /events | `#fffefb` (ấm nhẹ) |
| Toast | `react-toastify` cho kết quả các hành động |

---

## 1. Backend — Title auto-event

Trong `EventService.syncPersonEvents(person)`:

```ts
// honorific theo giới tính (Gender: MALE=0, FEMALE=1)
const honorific = person.gender === 1 ? 'bà' : 'ông';

// GIỖ (âm lịch)
const parts = solarToLunarParts(new Date(person.death));
const leap = parts.isLeapMonth ? ' nhuận' : '';
title = `Giỗ ${honorific} ${person.name} (${parts.day}/${parts.month}${leap})`;

// SINH NHẬT — giữ nguyên
title = `Sinh nhật ${person.name}`;
```

`person.gender` luôn có (schema `required`). Cập nhật unit test `event.service.spec.ts` để kỳ vọng title mới (vd giỗ nữ → `Giỗ bà Ông A (...)` theo dữ liệu test, có dấu ngoặc ngày âm).

## 2. Backend — Mốc nhắc & tách FE/Telegram

### `constants.ts`
```ts
export enum EventTrigger {
    ONE_MONTH = '1_month',
    ONE_WEEK = '1_week',
    ONE_DAY = '1_day',
    DAY_OF = 'day_of',
}
```
Bỏ `MONTH_START`, `WEEK_START`.

### `eventOccurrence.ts` — `getActiveTriggers`
```ts
if (sameDay(t, occ)) triggers.push(EventTrigger.DAY_OF);
if (sameDay(t, addDays(occ, -1))) triggers.push(EventTrigger.ONE_DAY);
if (sameDay(t, addDays(occ, -7))) triggers.push(EventTrigger.ONE_WEEK);
if (sameDay(t, monthsBefore(occ, 1))) triggers.push(EventTrigger.ONE_MONTH);
```
Bỏ 2 nhánh month_start/week_start. Giữ `monthsBefore` (đã có, fix overflow). Cập nhật `eventOccurrence.spec.ts`: bỏ test month_start/week_start, thêm test `ONE_DAY` (occ−1 ngày).

### `EventService.getNotifications()` (chuông FE) — đổi sang cửa sổ 30 ngày
```ts
const today = new Date();
const events = await this.eventModel.find({ isActive: true }).lean().exec();
const result = [];
for (const e of events) {
    const occ = nextOccurrence(e, today);
    if (!occ) continue;
    const d = daysUntil(occ, today);
    if (d < 0 || d > 30) continue;
    result.push({ event: e, occurrenceSolar: occ, daysUntil: d });
}
result.sort((a, b) => a.daysUntil - b.daysUntil);
return result;
```
(Không còn lọc theo trigger. `triggers` bỏ khỏi payload FE — FE không dùng.)

### `EventService.runDailyNotify()` (Telegram) — lọc theo 4 mốc + icon
Giữ logic gom event có `getActiveTriggers(...)` ≠ rỗng (tự tính riêng, không dựa `getNotifications`). Thêm icon loại trước title:
```ts
const ICON: Record<string, string> = { death: '🕯️', birth: '🎂', manual: '📅' };
// block:
`${ICON[e.sourceType] ?? '📅'} <b>${e.title}</b>\nNgày: ${occStr} (còn ${daysUntil} ngày)\n${labels}`
```
`triggerLabel`: thêm `ONE_DAY → 'Còn 1 ngày'`; bỏ nhãn month_start/week_start. Giữ `DAY_OF → '🔔 HÔM NAY'`, `ONE_WEEK → 'Còn 1 tuần'`, `ONE_MONTH → 'Còn 1 tháng'`.

## 3. Backend — Đồng bộ 1 người

### `EventService`
```ts
async syncOnePerson(personId: string): Promise<{ ok: true }> {
    if (!Types.ObjectId.isValid(personId)) throw new NotFoundException(`Invalid person ID: ${personId}`);
    const person = await this.personModel.findById(personId).exec();
    if (!person) throw new NotFoundException(`Person ${personId} not found`);
    await this.syncPersonEvents(person);
    return { ok: true };
}
```

### `EventController` — đặt route tĩnh trước `:id`
```ts
@Post('sync-person/:personId')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRoles.ADMIN, UserRoles.EDITOR)
syncPerson(@Param('personId') personId: string) {
    return this.eventService.syncOnePerson(personId);
}
```
Đặt cùng nhóm `sync-all` (đều là path tĩnh, trước `@Patch(':id')`/`@Delete(':id')`).

## 4. Frontend — react-toastify (hạ tầng)

- Cài `react-toastify`.
- `src/components/Providers.tsx`: thêm `<ToastContainer position="top-right" autoClose={2500} hideProgressBar newestOnTop theme="light" />` và `import 'react-toastify/dist/ReactToastify.css';`.
- Dùng `toast.success/error` cho kết quả hành động event (tạo/sửa/xóa/toggle/sync-all/refresh/push). Thay banner `syncMsg` ở `/events` bằng toast.

## 5. Frontend — Trang /events

- **Card**: nền `#fffefb` (thay `#fffaf0`), giữ border `#e5e5e5`.
- **Auto-event** (`sourceType !== 'manual'`): thêm **nút icon refresh** cạnh toggle + xóa → `eventService.syncPerson(event.sourcePersonId)` rồi `refresh()` + `toast.success('Đã cập nhật từ hồ sơ thành viên')`. Tooltip "Cập nhật lại từ hồ sơ". Manual event không có nút này. Dùng `busyId` để disable khi đang chạy.
- Kết quả delete/sync-all/create → toast thay cho alert/banner.

## 6. Frontend — Trang /persons (push event)

- `eventService` thêm `syncPerson(personId): Promise<{ ok: true }>` → `api.post('/event/sync-person/' + personId)`.
- `PersonList` nhận thêm prop `canEdit: boolean` và `onPushEvent?: (person) => void`. Thêm **cột hành động** cuối bảng (chỉ khi `canEdit`): nút icon (lịch/refresh) `title="Tạo/cập nhật sự kiện giỗ & sinh nhật"`, `onClick` gọi `e.stopPropagation()` rồi `onPushEvent(person)` (tránh mở modal chi tiết).
- `PersonsView`: thêm handler `handlePushEvent(person)` → `await eventService.syncPerson(person._id)` → `toast.success('Đã cập nhật sự kiện cho ' + person.name)` / `toast.error(...)`. Truyền `canEdit={isAdmin || isEditor}` và `onPushEvent` xuống `PersonList`.

## Phạm vi an toàn

- Không đổi schema DB. `getNotifications` đổi shape nhẹ (bỏ `triggers`) — FE bell không dùng `triggers` nên không vỡ; cập nhật type `EventNotification.triggers` thành optional.
- Title đổi chỉ ảnh hưởng auto-event mới sync; chạy "Tính lại" / "push" để cập nhật title cũ.
- Trang /persons giữ nguyên style bảng hiện có (xanh/xám), chỉ thêm 1 cột hành động.

## Testing

- `eventOccurrence.spec.ts`: cập nhật cho bộ 4 mốc (thêm `ONE_DAY`, bỏ month_start/week_start).
- `event.service.spec.ts`: cập nhật kỳ vọng title giỗ (có honorific + ngày âm trong ngoặc); thêm test `syncOnePerson` (404 khi không thấy person; gọi syncPersonEvents khi thấy).
- Build backend + frontend; smoke test thủ công: push ở /persons, refresh ở /events, message Telegram có icon.

## YAGNI / để sau

- Không đổi style tổng thể trang /persons.
- Không thêm toast cho mọi modal cũ (chỉ các hành động event trong phạm vi này) — nhưng hạ tầng toastify sẵn sàng tái dùng.
