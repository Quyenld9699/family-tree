# Family Tree Project

Ứng dụng lưu trữ và trực quan hóa gia phả dòng họ nhiều thế hệ, với cây gia phả cân bằng tự động render bằng `@xyflow/react`.

## Cấu trúc dự án

- `frontend/` — Next.js 14 (App Router) + TypeScript + Tailwind CSS + `@xyflow/react`
- `backend/` — NestJS + MongoDB (Mongoose). Khởi động bằng `docker-compose.yml`. Seed data trong `backend/src/seeds/`.

---

## Mô hình dữ liệu (Backend — MongoDB)

### Person (`/backend/src/modules/person`)

Một thành viên trong gia đình.

```ts
{
  cccd: string        // unique ID (cccd '0x00001' = gốc cây)
  name: string
  gender: 0 | 1       // 0 = MALE, 1 = FEMALE
  birth?: Date
  death?: Date
  isDead?: boolean
  avatar?: string     // Cloudinary URL
  address?: string
  desc?: string
}
```

### Spouse (`/backend/src/modules/spouse`)

Quan hệ vợ chồng giữa hai Person.

```ts
{
  husband: ObjectId   // ref Person
  wife: ObjectId      // ref Person
  husbandOrder?: number  // vợ thứ mấy của người chồng (1, 2, ...)
  wifeOrder?: number     // chồng thứ mấy của người vợ
  marriageDate?: Date
  divorceDate?: Date
}
```

Một người có thể có nhiều Spouse (đa thê/đa phu).

### ParentChild (`/backend/src/modules/parent-child`)

Một con của một cặp vợ chồng.

```ts
{
  parent: ObjectId    // ref Spouse (cặp bố+mẹ)
  child: ObjectId     // ref Person
  isAdopted?: boolean
}
```

Mỗi bản ghi ParentChild gắn với đúng 1 cặp Spouse và 1 Person con.

---

## Xác thực & phân quyền

- JWT-based. Token lưu trong cookie `token`.
- Roles: `admin` (toàn quyền) | `editor` (thêm/sửa) | `guest` (xem) | unauthenticated (fallback JSON tĩnh).
- Admin tạo guest code có thời hạn qua `POST /auth/guest-code`.
- Khi chưa đăng nhập, frontend dùng dữ liệu tĩnh trong `frontend/src/data/` (persons.json, spouses.json, parent_children.json).

---

## Thiết kế hiển thị cây gia phả (Frontend)

### Nguyên tắc bố cục

Cây được tổ chức theo **thế hệ (generation)** xếp dọc từ trên xuống. Mỗi thế hệ là một hàng ngang gồm các khối (block) bố cục.

Trong mỗi thế hệ, mỗi "chủ nhân" (người thuộc thế hệ đó do được sinh ra từ thế hệ trước) có:

- **Hàng 1 (y = OFFSET_PERSON = 0):** PersonNode — hình chữ nhật, viền xanh (nam) hoặc hồng (nữ).
- **Hàng 2 (y = OFFSET_RELATIONSHIP = 170):** RelationshipNode (hình thoi) — mỗi cặp vợ chồng của chủ nhân có 1 hình thoi.
- **Hàng 3 (y = OFFSET_SPOUSE = 350):** PersonNode của vợ/chồng — chỉ hiển thị nếu người đó **không** thuộc thế hệ này (tức là nhập gia / kết hôn vào).

Các con của một cặp vợ chồng được nối từ **Spouse Node (hàng 3)** xuống **PersonNode ở thế hệ tiếp theo**. (Không nối từ RelationshipNode.)

Mỗi thế hệ được bao bởi một generation box (nền đỏ nhạt, đường kẻ đứt). Nhãn "Thế hệ N" nằm bên trái ngoài box.

### Hằng số bố cục (`frontend/src/views/constants/layoutConstants.ts`)

```
PERSON_WIDTH = 128px
HORIZONTAL_GAP = 80px
GEN_VERTICAL_SPACE = 550px   // khoảng cách giữa các thế hệ
GEN_GAP = 20px
OFFSET_PERSON = 0
OFFSET_RELATIONSHIP = 170
OFFSET_SPOUSE = 350
```

---

## Thuật toán vẽ cây (frontend/src/views/utils/)

Pipeline được gọi trong `FamilyTreeFlow.tsx` (useMemo), gồm 3 bước:

### Bước 1 — Xây dựng thế hệ (`generationBuilder.ts`)

**`buildGenerations(rootPersonId, personMap, spouseMap, childrenMap, maxGenerations?)`**

- BFS từ `rootPersonId` (ưu tiên người có `cccd = '0x00001'`, fallback `persons[0]`).
- Mỗi vòng lặp duyệt các person của thế hệ hiện tại, thu thập con cái để đưa vào thế hệ tiếp theo.
- Visited set tránh lặp vòng.
- **Thứ tự trong thế hệ**: với mỗi cha/mẹ, duyệt theo thứ tự Spouse đã sắp xếp; trong mỗi Spouse, con xếp theo ngày sinh tăng dần.
- Trả về `generations: Person[][]` và `personGeneration: Map<string, number>`.

**`buildChildrenByParentMap`** — bản đồ `spouseId → childId[]` để dùng khi vẽ cạnh.

### Bước 2 — Tính vị trí X (`positionCalculator.ts`)

**`calculateNodePositions(generations, spouseMap, childrenMap, personGeneration, childrenByParent, personMap)`**

Thuật toán đệ quy **block layout** từ dưới lên (post-order), đảm bảo:

- Cha mẹ căn giữa trên nhóm con.
- RelationshipNode căn giữa trên nhóm con của cặp đó.
- SpouseNode thẳng hàng với RelationshipNode.

**`calculateLayout(personId) → LayoutNode`**:

1. Nếu không có vợ/chồng: `width = PERSON_WIDTH`, `center = width/2`.
2. Với mỗi Spouse (đã sắp xếp), đệ quy tính layout từng con → `childLayouts[]`.
3. Tính `childrenTotalWidth` và `childrenCenter` (trung điểm tâm con đầu và con cuối).
4. `relCenter` (tâm RelationshipNode) = `childrenCenter` (nếu có con), ngược lại = `PERSON_WIDTH/2`.
5. `blockWidth` bao phủ cả children lẫn SpouseNode.
6. Ghép tất cả SpouseBlock → `totalSpousesWidth`.
7. `mainPersonCenter` = trung điểm các `relCenter` → tâm PersonNode chính.
8. `totalWidth` bao phủ cả spouseBlocks lẫn PersonNode chính.

**`applyLayout(layout, startX)`** — gán toạ độ X vào 3 map:

- `nodeXPositions`: PersonNode chính.
- `relationshipXPositions`: RelationshipNode.
- `spouseNodeXPositions`: SpouseNode (người kết hôn vào, id dạng `spouse_<pid>_of_<mainId>_<idx>`).

### Bước 3 — Tạo nodes & edges (`nodeRenderer.ts`)

**`renderFamilyTree(...)`**:

- Tính `absoluteMinX/MaxX` để xác định kích thước generation box tự động.
- Với mỗi thế hệ: tạo generation box node + label node.
- Với mỗi person: `renderPerson()` → tạo PersonNode, rồi với mỗi Spouse gọi `renderSpouseRelationship()`.
- `renderSpouseRelationship()`:
    - Tạo RelationshipNode.
    - Edge: PersonNode → RelationshipNode.
    - Nếu Spouse person không thuộc `personGeneration` (người kết hôn vào): tạo SpouseNode thêm vào, Edge: RelationshipNode → SpouseNode.
    - Edges con: từ SpouseNode (hoặc person gốc nếu thuộc tree) → PersonNode của con ở thế hệ dưới.

### Sắp xếp (`treeHelpers.ts`)

- **`sortSpouses`**: ưu tiên `wifeOrder` (nếu cả hai > 0 và khác nhau), sau đó `husbandOrder`, fallback `marriageDate`.
- **`sortChildrenByBirthDate`**: sort theo `birth` tăng dần.
- **`getChildId`**: lấy `_id` từ `ParentChildWithDetails.child` (string hoặc object).
- **`getSpousePersonId`**: trả về ID của người kia trong cặp Spouse.

---

## Luồng dữ liệu Frontend

```
useFamilyData (React Query, staleTime 5m)
  └─ personService / spouseService / parentChildService
       ├─ authenticated → REST API backend
       └─ unauthenticated → static JSON in src/data/

FamilyTreeFlow (useMemo)
  ├─ buildGenerations(root, maps, maxGen?)
  ├─ calculateNodePositions(...)
  └─ renderFamilyTree(...) → { nodes, edges } → ReactFlow
```

Tìm kiếm: chọn `rootPersonId` + `maxGenerations` → chỉ vẽ cây con từ người đó N thế hệ.

---

## Âm lịch & Lịch giỗ

### Thư viện

`lunar-javascript` — chuyển đổi dương lịch ↔ âm lịch. Type declarations tự định nghĩa tại `src/types/lunar-javascript.d.ts`.

### Utility (`src/utils/lunarDateUtils.ts`)

- **`toVietnameseLunarDate(date)`** → chuỗi đầy đủ `"16 tháng 3 năm Ất Dậu"` — dùng trong modal.
- **`toVietnameseLunarDateShort(date)`** → chuỗi ngắn `"16/3 Ất Dậu"` — dùng trong PersonNode.
- Xử lý tháng nhuận (tháng âm lịch âm), ánh xạ Can Chi sang tiếng Việt.

### Hook lịch giỗ (`src/hooks/useGioReminders.ts`)

**`useGioReminders(persons) → GioReminder[]`**:

- Duyệt persons có `isDead && death`, chuyển ngày mất sang âm lịch.
- Tính ngày giỗ năm âm lịch hiện tại bằng `Lunar.fromYmd` → `getSolar()`.
- Nếu đã qua → thử năm âm lịch tiếp theo.
- Chỉ trả về giỗ trong vòng **0–30 ngày** từ hôm nay, sắp xếp theo ngày gần nhất.
- `GioReminder`: `{ person, gioDate, gioLunarStr, daysUntil }`.

### Component (`src/components/GioBellIcon/GioBellIcon.tsx`)

- Chuông thông báo ở TopBar, badge đỏ hiển thị số lượng giỗ sắp tới.
- Viền vàng ochre khi có thông báo.
- Dropdown danh sách: tên, năm mất, ngày giỗ âm + dương lịch, label màu theo độ gấp (Hôm nay / Ngày mai / Còn N ngày).
- `TopBar` nhận thêm prop `persons: Person[]`, tính `gioReminders` bằng hook và truyền vào `GioBellIcon`.

---

## Cấu trúc thư mục frontend quan trọng

```
src/
  views/
    Root/          — trang chính (Root.tsx + components/)
    utils/
      generationBuilder.ts   — Bước 1: BFS xây thế hệ
      positionCalculator.ts  — Bước 2: block layout đệ quy tính X
      nodeRenderer.ts        — Bước 3: tạo nodes/edges cho ReactFlow
      treeHelpers.ts         — sort helpers, ID extractors
    constants/
      layoutConstants.ts     — PERSON_WIDTH, OFFSET_*, GEN_* constants
  components/
    FamilyTree/FamilyTreeFlow.tsx  — entry point kết nối pipeline + ReactFlow
    PersonNode/                    — hiển thị person hình chữ nhật
    RelationshipNode/              — hiển thị quan hệ hình thoi
    GioBellIcon/                   — chuông thông báo lịch giỗ (TopBar)
  hooks/
    useFamilyData.ts               — React Query fetch persons/spouses/parentChilds
    useGioReminders.ts             — tính danh sách giỗ trong 30 ngày tới
  services/
    personService.ts / spouseService.ts / parentChildService.ts / authService.ts
  utils/
    genderUtils.ts
    lunarDateUtils.ts              — chuyển đổi dương→âm lịch tiếng Việt
  types/
    lunar-javascript.d.ts          — TypeScript declarations cho lunar-javascript
  context/
    AuthContext.tsx
```

---

## Lưu ý khi phát triển

- Root person mặc định là người có `cccd === '0x00001'`.
- SpouseNode được đặt id dạng `spouse_<personId>_of_<mainPersonId>_<idx>` để tránh conflict khi 1 người làm vợ/chồng nhiều lần.
- Edges con luôn nối từ **SpouseNode (hàng 3)** chứ không phải từ RelationshipNode (hàng 2).
- `parentId` của mỗi node trong ReactFlow là id generation box (`gen${genIndex}`) nhưng generation box không dùng `type: 'group'` — chúng là node riêng không có nested layout của ReactFlow.
- Backend chạy qua Docker: `docker-compose up` trong thư mục `backend/`.
- `PersonNodeHeight = 130` (tăng từ 112 để chứa dòng âm lịch và hưởng thọ trong PersonNode).
- Ngày mất trong PersonNode hiển thị âm lịch ngắn (màu đỏ) + "Hưởng thọ: N tuổi" (dòng riêng).
- Ngày mất trong PersonDetailModal hiển thị 3 dòng: dương lịch → âm lịch → hưởng thọ.
- Luôn check responsive mobile cho các component được code mới. Ưu tiên mobile-first, dùng Tailwind responsive classes (`sm:`, `md:`, `lg:`) khi cần.

---

## Design System — Theme (`.github/DESIGN.md`)

Dự án tuân theo design system Clay-inspired được mô tả đầy đủ trong `.github/DESIGN.md`. Mọi thay đổi UI phải nhất quán với hệ thống này.

### Bảng màu chính

| Token            | Hex       | Dùng ở đâu                            |
| ---------------- | --------- | ------------------------------------- |
| `canvas`         | `#fffaf0` | Background trang, nền node, nền input |
| `primary`        | `#0a0a0a` | CTA button, headline text             |
| `ink`            | `#0a0a0a` | Heading text                          |
| `body`           | `#3a3a3a` | Body text                             |
| `muted`          | `#6a6a6a` | Sub-text, placeholder                 |
| `hairline`       | `#e5e5e5` | 1px border card, input                |
| `brand-pink`     | `#ff4d8b` | Female accent, PersonNode nữ          |
| `brand-teal`     | `#1a3a3a` | Male accent, PersonNode nam           |
| `brand-lavender` | `#b8a4ed` | Accent phụ                            |
| `brand-ochre`    | `#e8b94a` | Generation box border, accent         |
| `surface-card`   | `#f5f0e0` | Card thứ cấp, generation box bg       |

### Typography

- **Display**: Inter 600, letter-spacing âm (-0.5px đến -1px) → heading trong modal, tên người
- **Body**: Inter 400, 14-16px, line-height 1.55
- **Caption**: Inter 500, 12-13px → ngày sinh, ghi chú nhỏ trong node

### Component design tokens

- **Buttons**: `bg-[#0a0a0a] text-white rounded-[12px] px-5 py-3 text-sm font-semibold`
- **Inputs**: `bg-[#fffaf0] border border-[#e5e5e5] rounded-[12px] px-4 py-3 text-sm`
- **Cards**: `bg-[#fffaf0] border border-[#e5e5e5] rounded-[16px]`
- **Feature cards**: `rounded-[24px]` với saturated brand color
- **PersonNode (nam)**: border-left hoặc top-border `#1a3a3a` (brand-teal), bg `#fffaf0`
- **PersonNode (nữ)**: border `#ff4d8b` (brand-pink), bg `#fffaf0`
- **RelationshipNode**: diamond bg `#fffaf0`, border split màu nam/nữ
- **Generation box**: bg `rgba(245,240,224,0.35)` (surface-card tinted), border dashed `#e8b94a` (ochre)

### Nguyên tắc

- Nền ấm cream (`#fffaf0`) — KHÔNG dùng cool gray hay pure white.
- Không dùng shadow nặng. Depth từ border và màu contrast.
- Hover state: `scale(1.02)` hoặc `border-opacity tăng` — không thêm box-shadow phức tạp.
- Font chính: Inter (Google Fonts). Fallback: `-apple-system, BlinkMacSystemFont, sans-serif`.

---

## Skills cải thiện code (frontend/.agents/skills/)

### `vercel-composition-patterns`

- Tránh boolean props (`isAdmin`, `isEditor` truyền sâu) — dùng compound components hoặc context.
- Tách state vào provider, component chỉ consume interface.
- Dùng explicit variant components thay vì `if (isAdmin)` render logic rải rác.

### `vercel-react-best-practices`

- **Eliminating Waterfalls (CRITICAL)**: `useFamilyData` dùng `Promise.all` (đúng rồi). Đảm bảo không có sequential await ở API routes.
- **Bundle size**: tránh barrel imports (`import x from 'src/services'`) — import trực tiếp từ file.
- **Re-render**: `nodeTypes` trong `FamilyTreeFlow` đã được `useMemo` — giữ nguyên. Tránh tạo object inline làm prop.
- **`rerender-memo`**: `calculateNodePositions` nặng, đã được bọc `useMemo` — đúng.

### `vercel-react-view-transitions`

- Có thể thêm `<ViewTransition>` khi mở/đóng modal PersonDetail / RelationshipDetail.
- Route change animation khi navigate `/persons` ↔ `/` (family tree).

### `web-design-guidelines`

- Dùng để audit UI accessibility (contrast ratio, focus states, ARIA labels trên PersonNode/RelationshipNode).

### `vercel-optimize`

- Dùng khi deploy lên Vercel để phân tích performance theo route thực tế.
