# Thiết kế: Hệ thống Event (lịch giỗ / sinh nhật / lễ gia đình)

> Ngày: 2026-06-23
> Trạng thái: Đã duyệt thiết kế, chờ viết implementation plan

## 1. Mục tiêu

Thêm bảng `Event` để quản lý các sự kiện lặp lại hằng năm của dòng họ:

1. **CRUD event thủ công** — thêm/sửa/xóa lễ gia đình, hoặc giỗ của người không có ngày mất cụ thể trong gia phả (theo lịch âm hoặc dương do người tạo chọn).
2. **Auto-sync từ Person** — khi thêm/sửa ngày mất → tự tạo/cập nhật event giỗ (âm lịch); khi thêm/sửa ngày sinh → tự tạo/cập nhật event sinh nhật (dương lịch).
3. **Bảng event là single source** cho cả thông báo FE lẫn Telegram bot.
4. **Telegram bot** thông báo qua Vercel Cron gọi endpoint NestJS mỗi sáng 7h (VN).
5. **An toàn dữ liệu cũ** — chỉ thêm collection mới + thêm code; không thay đổi schema/dữ liệu Person, Spouse, ParentChild.

## 2. Ràng buộc & quyết định đã chốt

| Quyết định | Lựa chọn |
|---|---|
| Mô hình lưu | **Chỉ lưu rule (ngày/tháng gốc), tính occurrence khi cần** — KHÔNG lưu `occurrenceSolar`, KHÔNG có job materialize 1/1 |
| Cơ sở lịch | Field `calendar: 'lunar' \| 'solar'`. Giỗ → lunar (bắt buộc). Sinh nhật → solar (bắt buộc). Manual → người tạo chọn |
| Mốc thông báo | 5 mốc dùng chung cho cả Telegram và chuông FE: trước 1 tháng, trước 1 tuần, đầu tuần chứa sự kiện, đầu tháng chứa sự kiện, đúng ngày |
| Quyền xem event | Yêu cầu đăng nhập (admin + guest-code). Guest chưa-login KHÔNG thấy event. `GET /event*` yêu cầu JWT |
| Auto-sync | **Cách A** — inject `EventService` vào `PersonService`, gọi đồng bộ trong create/update/remove |
| Cron | `0 0 * * *` (00:00 UTC ≈ 7h sáng VN). Vercel Hobby (free): 1 lần/ngày — vừa khít |

## 3. Kiến trúc tổng thể

```
PersonService.create/update/remove
   └─ (Cách A) gọi EventService.syncPersonEvents / removePersonEvents  ← upsert idempotent

EventModule (mới)
   ├─ EventService      — CRUD + sync + tính occurrence + soạn & gửi Telegram
   ├─ EventController   — REST: CRUD (JWT), /notifications (JWT), /cron/daily-notify (CRON_SECRET), /sync-all (admin)
   ├─ schemas/event.schema.ts
   └─ utils/eventOccurrence.ts — computeOccurrence(), getActiveTriggers()  (thuần, test được)

Vercel Cron (vercel.json) → GET /event/cron/daily-notify → Telegram group

Frontend
   ├─ /events page (list + CRUD manual, sort theo ngày-trong-năm)
   ├─ useEventNotifications → GET /event/notifications → GioBellIcon
   └─ eventService.ts + useEvents (React Query)
```

PersonModule import EventModule (một chiều). EventService KHÔNG phụ thuộc ngược PersonService → tránh circular DI.

## 4. Data model

Collection mới `events`. Không đụng collection cũ.

```ts
// backend/src/modules/event/schemas/event.schema.ts
@Schema({ timestamps: true })
class Event {
  title: string;                         // "Giỗ Nguyễn Văn A", "Sinh nhật ...", "Lễ gia tiên"
  desc?: string;

  sourceType: 'death' | 'birth' | 'manual';
  sourcePersonId?: ObjectId;             // ref Person; null nếu manual. Dùng show avatar/link

  calendar: 'lunar' | 'solar';

  // Ngày gốc lặp lại hằng năm — KHÔNG lưu năm
  day: number;                           // 1..31
  month: number;                         // 1..12
  isLeapMonth?: boolean;                 // chỉ lunar (tháng nhuận)

  isActive: boolean;                     // default true; tắt thông báo mà không xóa
}
```

**Index:**
- Partial unique index `{ sourceType: 1, sourcePersonId: 1 }` áp dụng khi `sourcePersonId` tồn tại → mỗi person tối đa 1 giỗ + 1 sinh nhật, upsert idempotent, không trùng. Manual event (`sourcePersonId` null) không bị ràng buộc.

**Lưu ý lịch:**
- `lunarDateUtils` được dùng ở cả FE & BE. BE cần để: (1) đổi `death`/`birth` (dương) → ngày âm khi tạo event giỗ; (2) đổi ngày gốc → occurrence dương của năm hiện tại trong cron & API `/notifications`. `lunar-javascript` chạy được trên Node — thêm vào dependency backend.

## 5. Auto-sync Person → Event (Cách A)

`EventService` cung cấp 2 method idempotent:

```
syncPersonEvents(person):
  // GIỖ (lunar)
  if person.isDead && person.death:
     đổi person.death (dương) → (day, month, isLeapMonth) âm lịch
     upsert event { sourceType:'death', sourcePersonId, calendar:'lunar',
                    day, month, isLeapMonth, title:`Giỗ ${name}`, isActive giữ nguyên nếu đã có }
  else:
     xóa event { sourceType:'death', sourcePersonId } nếu tồn tại   // isDead tắt / xóa ngày mất

  // SINH NHẬT (solar)
  if person.birth:
     upsert event { sourceType:'birth', sourcePersonId, calendar:'solar',
                    day = ngày dương, month = tháng dương, title:`Sinh nhật ${name}` }
  else:
     xóa event { sourceType:'birth', sourcePersonId } nếu tồn tại

  // title luôn cập nhật theo name mới khi update person

removePersonEvents(personId): deleteMany { sourcePersonId }
```

**Gắn vào PersonService:**
- `create()` → sau khi tạo person thành công, gọi `syncPersonEvents(newPerson)`.
- `update()` → sau khi update, gọi `syncPersonEvents(updatedPerson)`.
- `remove()` → gọi `removePersonEvents(id)` cùng chỗ đang xóa spouse / parent-child.

**Backfill 1 lần:** `POST /event/sync-all` (admin) duyệt toàn bộ persons hiện có → gọi `syncPersonEvents` cho từng người → sinh event cho dữ liệu cũ. Chạy 1 lần sau deploy. Idempotent (chạy lại an toàn).

## 6. Tính occurrence & logic 5 mốc (`utils/eventOccurrence.ts`)

Hàm thuần, không phụ thuộc DB → unit-test dễ.

```
computeOccurrence(event, year) → Date | null
  - solar: new Date(year, month-1, day)
  - lunar: Lunar.fromYmd(year, isLeapMonth ? -month : month, day).getSolar() → Date; lỗi → null

nextOccurrence(event, today) → Date
  - lấy occurrence năm nay; nếu < today → occurrence năm sau (cuộn như logic giỗ FE hiện tại)

getActiveTriggers(event, today) → Trigger[]   // rỗng nếu hôm nay không khớp mốc nào
  occ = nextOccurrence(event, today)
  - '1_month'     : today === occ trừ 1 tháng
  - '1_week'      : today === occ trừ 7 ngày
  - 'month_start' : today === ngày 1 của tháng (dương) chứa occ
  - 'week_start'  : today === thứ Hai của tuần chứa occ
  - 'day_of'      : today === occ
```

Tất cả so sánh ở mức **ngày** (bỏ giờ). Một event có thể khớp nhiều mốc cùng ngày (vd '1_week' trùng 'week_start') → dedup ở tầng soạn message.

## 7. API endpoints (EventController)

| Method | Path | Guard | Mô tả |
|---|---|---|---|
| GET | `/event` | JWT (mọi role) | List toàn bộ event, **sort theo nextOccurrence** (ngày-trong-năm gần nhất) |
| GET | `/event/notifications` | JWT | Event có trigger hôm nay (BE tính sẵn `triggers[]` + occurrence dương/âm + daysUntil) cho chuông FE |
| POST | `/event` | ADMIN, EDITOR | Tạo manual event (validate: manual mới được set calendar/title tùy ý; không cho tạo sourceType death/birth thủ công) |
| PATCH | `/event/:id` | ADMIN, EDITOR | Sửa event. Với auto-event chỉ cho sửa `desc`/`isActive` (ngày do person chi phối); manual sửa mọi field |
| DELETE | `/event/:id` | ADMIN, EDITOR | Xóa event |
| POST | `/event/sync-all` | ADMIN | Backfill từ persons (chạy 1 lần) |
| GET | `/event/cron/daily-notify` | CRON_SECRET header | Vercel Cron gọi → gửi Telegram |

## 8. Telegram bot + Vercel Cron

- `vercel.json`:
  ```json
  { "crons": [{ "path": "/event/cron/daily-notify", "schedule": "0 0 * * *" }] }
  ```
  (00:00 UTC ≈ 7h sáng VN. Hobby: 1 lần/ngày.)
- Endpoint `/event/cron/daily-notify` bảo vệ bằng header `Authorization: Bearer ${CRON_SECRET}` (Vercel tự gắn từ env) — KHÔNG dùng JWT user.
- Logic: duyệt mọi event `isActive=true` → gom event có `getActiveTriggers(...)` không rỗng → soạn **1 message digest** (gộp theo mốc, dedup) → gửi tới Telegram group.
- Env mới (backend): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRON_SECRET`.
- Message kèm: tên, loại (giỗ/sinh nhật/lễ), ngày âm + dương, "còn N ngày", mốc trigger. Gửi qua `fetch` tới `https://api.telegram.org/bot<token>/sendMessage`.
- Nếu thiếu env Telegram → endpoint log cảnh báo, không crash.

## 9. Frontend

- **Page mới `/events`** (chỉ user đã login):
  - List toàn bộ event, **sort theo ngày-trong-năm** (nextOccurrence sắp tới), filter theo loại (giỗ/sinh nhật/lễ).
  - CRUD manual event (admin/editor): form chọn calendar (âm/dương), nhập day/month (+ nhuận nếu âm), title, desc.
  - Auto-event hiển thị read-mostly (chỉ sửa desc/isActive).
- **Thông báo:** `useGioReminders` → thay bằng `useEventNotifications` gọi `GET /event/notifications`; render ở `GioBellIcon`. Chuông chỉ hiện khi đã login. Logic tự-tính-giỗ-từ-persons cũ ở FE **gỡ bỏ** (event là nguồn duy nhất).
- `services/eventService.ts` (CRUD + notifications), `hooks/useEvents.ts` (React Query, staleTime 5m).
- Tuân design system Clay-inspired (`.github/DESIGN.md`); responsive mobile-first.

## 10. Phạm vi an toàn (không phá vỡ dữ liệu cũ)

- Chỉ thêm collection `events` + module Event + dependency `lunar-javascript` (backend).
- Person/Spouse/ParentChild schema **không đổi**. Chỉ thêm lời gọi `EventService` trong PersonService.
- FE: thêm page + service + hook; gỡ code tính giỗ client-side cũ.
- Backfill qua endpoint admin riêng, idempotent.

## 11. Testing

- Unit test `eventOccurrence.ts`: solar & lunar occurrence (gồm tháng nhuận), cuộn sang năm sau, 5 mốc trigger (kể cả trùng mốc).
- Unit test `EventService.syncPersonEvents`: tạo/cập nhật/xóa theo isDead, death, birth; idempotent (gọi 2 lần không trùng).
- Test guard: `/event` yêu cầu JWT; `/cron/daily-notify` yêu cầu CRON_SECRET; CRUD yêu cầu role.

## 12. Câu hỏi mở / để sau (YAGNI)

- Chưa làm: nhiều Telegram group, thông báo cá nhân hóa per-user, lịch sử đã-gửi. Daily cron idempotent theo ngày nên không cần bảng sent-log.
- Chưa làm: EventInstance theo từng năm (mô hình hybrid bị loại).
