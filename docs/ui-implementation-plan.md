# UI Implementation Plan — LINE OA Webchat

> แผนแปลงดีไซน์จาก Design canvas "LINE OA Webchat" เป็นหน้าจอจริง
> ต่อยอดจาก [implementation-plan.md](implementation-plan.md) ซึ่งเป็นแผนภาพรวมของทั้งโปรเจกต์

---

## Context

repo นี้เพิ่งผ่าน Phase 0 ของ [implementation-plan.md](implementation-plan.md) — มี Next.js 16.3.5 (App Router, TS strict, Tailwind v4), TanStack Query, Zustand และโครง `features/` `shared/` `server/` แต่ยังไม่มีหน้าจอจริงสักหน้า

ตอนนี้มีดีไซน์แล้ว 4 artboards: Login 1440×900, Chat console desktop 1440×900, Mobile conversations 390×844, Mobile chat room 390×844 แผนนี้คือการแปลงดีไซน์นั้นเป็นหน้าจอที่กดใช้งานได้จริง

**ขอบเขต:** ทำ UI ก่อน โดยให้ route handlers ตอบจาก in-memory fixtures — ได้เห็นของจริงในเบราว์เซอร์โดยยังไม่ต้องตั้ง Neon และ LINE channel ส่วน API contract เขียนตาม §5 ของแผนเดิมและ shape ของข้อมูลตรงกับ Prisma models ใน §4 ดังนั้น Phase 1–3 ที่จะตามมาแทบไม่ต้องแตะ UI เลย แค่สลับชั้น data

**เข้า v1:** layout ทั้งหมด, ส่งข้อความ (optimistic + PENDING/FAILED + retry), polling, unread badge, สถานะ unfollow, responsive, profile panel ด้านขวา, หน้า login

**ไม่เข้า v1:** ช่องค้นหาและแท็บทั้งหมด/ยังไม่อ่าน, bubble แบบ sticker และ unsupported, ปุ่มตั้งค่าใน nav rail

---

## สิ่งที่ตัดสินใจไว้ล่วงหน้า

1. **Nav rail แถบซ้าย 72px ยังทำ** แต่ตัดปุ่มตั้งค่าออก เหลือโลโก้ ปุ่มแชท (active) และออกจากระบบ เพราะ logout ต้องมีที่อยู่ และแถบดำนี้เป็นโครงหลักของดีไซน์
2. **ตัดช่องค้นหาและแท็บออกทั้งก้อน** ไม่ทำเป็น input ที่กดแล้วไม่เกิดอะไร หัว sidebar เหลือ "Conversations" กับตัวนับ unread
3. **แถวใน sidebar ใช้ `<Link>` ไม่ใช่ `<button>`** ดีไซน์ใช้ปุ่มเพราะเป็น prototype แต่ §6 ของแผนเดิมต้องการให้ refresh และแชร์ URL ได้ จึงต้องเป็นลิงก์จริงไป `/chat/[userId]`
4. **Avatar ใช้ `pictureUrl` จาก LINE ถ้ามี ไม่มีค่อย fallback เป็นอักษรย่อ** ดีไซน์วาดเป็นอักษรย่อ แต่ §1 ของแผนเดิมระบุว่าต้องดึงรูปจาก Get Profile API — ทำทั้งสองทางครอบคลุมทั้งคู่
5. **ไอคอนก๊อป path จากดีไซน์มาใส่ `icons.tsx`** ไม่เพิ่ม `lucide-react` — ได้หน้าตาตรงเป๊ะและไม่เพิ่ม dependency
6. **จัดรูปแบบเวลาฝั่ง client เท่านั้น** ป้องกัน hydration mismatch (ดู Step 6)

---

## Step 1 — Design tokens และฟอนต์

**`src/styles/globals.css`** — ทิ้ง boilerplate ของ create-next-app (ตัวแปร Geist และ dark mode) ทั้งหมด ดีไซน์เป็น light เท่านั้น ใส่ palette เป็น `@theme` ของ Tailwind v4:

| กลุ่ม | ค่า |
|---|---|
| พื้น | `paper #F4F2EC` · `raised #FBFAF6` · `surface #FFFFFF` |
| หมึก | `ink #1B1D1A` · `muted #5E625B` · `placeholder #767A71` |
| เส้นขอบ | `#E2DFD6` (ปกติ) · `#D8D4C9` · `#CFCBC0` (composer, input) |
| accent | `#0B6B3A` · hover `#084F2B` · pending `#3E7A57` · ring `#D3E7DA` · disabled `#9FAFA5` |
| ล้มเหลว | bg `#FBEAE8` · ink `#7A1F17` · border `#E7B7B1` · status `#B3261E` · retry `#9B2419` |
| เตือน | banner bg `#FBF1EA` · border `#EBCFBD` · ink `#7A2E0E` (ใช้กับ badge Unfollowed `#F6E3D6` ด้วย) |
| บนพื้นดำ | `#34372F` (ปุ่ม active) · `#B4B8AE` · `#D6D8D1` · `#A9ADA3` · `#9FD1B2` |
| เบ็ดเตล็ด | chip `#EAE7DF` · แถวที่เลือก `#E4EEE7` · เส้นประ `#BDB8AB` |

พร้อม avatar 6 คู่ (bg/ink) จากดีไซน์: `#F3DFC9`/`#6B3A12`, `#DCE8F3`/`#1F4A70`, `#E4DDF2`/`#46307A`, `#F4DCE4`/`#7A2745`, `#DDEEE0`/`#1F5A33`, `#ECE7DA`/`#5A4B22`

เพิ่ม base styles: `body` พื้น paper หมึก ink, และ `:focus-visible { outline: 2px solid accent; outline-offset: 2px }` ตามที่ทุก artboard กำหนด

**`src/app/layout.tsx`** — เปลี่ยน `Geist`/`Geist_Mono` เป็นสามฟอนต์จาก `next/font/google`:
- `IBM_Plex_Sans_Thai` (400/500/600/700, subsets `thai` + `latin`) → `--font-sans` ตัวเนื้อหา
- `Space_Grotesk` (500/700) → `--font-display` ใช้กับ "Conversations", หัวข้อหน้า login, โลโก้
- `IBM_Plex_Mono` (400/500) → `--font-mono` ใช้กับเวลา, ตัวนับ, userId, "sync 3s"

## Step 2 — Primitives ที่ใช้ร่วม

- **`src/shared/components/ui/icons.tsx`** — SVG ที่ก๊อป path มาจากดีไซน์ตรง ๆ: `MessageCircle`, `LogOut`, `Search`, `ChevronLeft`, `Send`, `Copy`, `PanelRight`, `Info`, `RotateCw`, `AlertCircle` ทุกตัวรับ `size` และใช้ `stroke="currentColor"`
- **`src/shared/components/ui/Avatar.tsx`** — รับ `displayName`, `pictureUrl`, `userId`, `size` แสดงรูปถ้ามี ไม่มีก็อักษรย่อบนพื้นสีที่คำนวณจาก `userId`
- `src/shared/utils/cn.ts` และ `src/shared/constants/routes.ts` มีอยู่แล้ว ใช้ได้เลย

## Step 3 — Types, schemas และ mock store

**`src/features/chat/types.ts`** — ตั้งชื่อ field ให้ตรงกับ Prisma models ใน §4 ของแผนเดิม เพื่อให้สลับไป Prisma แล้ว UI ไม่ต้องแก้:

```ts
type Direction = 'INBOUND' | 'OUTBOUND';
type MessageStatus = 'PENDING' | 'SENT' | 'FAILED';
type MessageType = 'text' | 'sticker' | 'image' | 'unsupported';

type Conversation = {
  userId: string; displayName: string; pictureUrl: string | null;
  statusMessage: string | null; isFollowing: boolean; unreadCount: number;
  lastMessage: string | null; lastMessageAt: string | null; createdAt: string;
};

type Message = {
  id: string; lineUserId: string; direction: Direction; type: MessageType;
  text: string | null; status: MessageStatus; error: string | null; sentAt: string;
};
```

วันเวลาเป็น ISO string ทั้งหมด เพื่อให้ผ่าน JSON ได้โดยไม่ต้องแปลง

**`src/features/chat/schemas.ts`** — zod: `sendMessageSchema` (`text` 1–5000 ตาม §5) ใช้ทั้งฝั่ง route handler และฟอร์ม

**`src/server/mock/conversations.ts`** — `import 'server-only'` เก็บ state ไว้ใน module-level array seed ด้วยข้อมูลชุดเดียวกับในดีไซน์ (ผู้ใช้ 6 คน: สมชาย ใจดี unread 2, Suda P., ณัฐพงศ์ ศรีสุข, Ploy Chanakarn, กิตติศักดิ์ มั่นคง, Mali W. ที่ unfollow แล้ว พร้อมบทสนทนาของแต่ละคน) เปิด function ชุดเดียวกับที่ repository จริงจะมี: `listConversations`, `listMessages`, `appendOutbound`, `markAsRead`

> in-memory ใช้ได้เฉพาะตอน `next dev` — บน Vercel แต่ละ invocation ไม่แชร์ memory ตามที่ §2 ของแผนเดิมเตือนไว้ ก้อนนี้จะถูกแทนด้วย Prisma ใน Phase 1

**`src/config/env.server.ts`** — ตอนนี้ parse ทุกตัวพร้อมกัน เฟส mock ที่ยังไม่มี `DATABASE_URL` และ LINE credentials จะ throw ทันทีที่แตะ แยกเป็น getter ต่อเรื่อง แต่ละตัว parse เฉพาะส่วนของตัวเอง: `getAuthEnv()` (`ADMIN_PASSWORD`, `SESSION_SECRET`), `getLineEnv()`, `getDbEnv()` แบบนี้ Step 10 เรียก `getAuthEnv()` ได้โดยไม่ลาก DB มาด้วย และยังใช้ต่อได้ตอนเข้า Phase 1

## Step 4 — Route handlers

ตาม §5 ของแผนเดิม ทุกไฟล์อ่านจาก mock store ของ Step 3 และ validate ด้วย zod

| ไฟล์ | เมธอด |
|---|---|
| `src/app/api/conversations/route.ts` | `GET` → เรียงตาม `lastMessageAt` ล่าสุดก่อน |
| `src/app/api/conversations/[userId]/messages/route.ts` | `GET` ประวัติแชท · `POST` ส่งข้อความ |
| `src/app/api/conversations/[userId]/read/route.ts` | `POST` reset `unreadCount` |

**เฉพาะ Next 16:** `params` เป็น Promise ต้อง `const { userId } = await params` (ยืนยันจาก `node_modules/next/dist/docs/`) ส่วน route handlers ไม่ถูก cache โดย default อยู่แล้วจึงไม่ต้องใส่ `dynamic`

`POST messages` ใน mock ให้หน่วงเล็กน้อยแล้วตอบ `SENT` และตอบ `409` พร้อม `error` ถ้าผู้ใช้ `isFollowing === false` — จะได้ทดสอบ path FAILED กับปุ่มส่งใหม่ได้จริง

## Step 5 — ชั้น query และ store

- **`src/features/chat/api.ts`** — fetcher ที่มี type: `fetchConversations`, `fetchMessages`, `sendMessage`, `markAsRead` โยน error ที่อ่านรู้เรื่องเมื่อ response ไม่ ok
- **`src/features/chat/query-keys.ts`** — มี `conversations()` และ `messages(userId)` อยู่แล้ว ใช้ต่อได้
- **`src/features/chat/hooks/`**
  - `useConversations` — `refetchInterval: 3000` ตาม §6 และตั้ง `refetchIntervalInBackground: false` เพื่อหยุด poll ตอนสลับแท็บ ตามที่ §13 ระบุเป็นความเสี่ยง
  - `useMessages(userId)` — `refetchInterval: 2000`
  - `useSendMessage` — optimistic: ยัดข้อความ `PENDING` เข้า cache ทันที, `onError` เปลี่ยนเป็น `FAILED` เก็บข้อความ error, `onSettled` invalidate ทั้ง messages และ conversations
  - `useMarkAsRead` — ยิงตอนเปิดห้อง แล้ว invalidate conversations
- **`src/features/chat/stores/chat-store.ts`** — ตอนนี้เก็บ `selectedUserId` ซึ่งซ้ำกับ URL แล้ว ถอดออก เหลือ state ที่ไม่ได้อยู่ใน URL และไม่ใช่ server data จริง ๆ คือ `drafts: Record<userId, string>` (ข้อความที่พิมพ์ค้างไว้ ไม่หายตอนสลับห้อง) กับ `isProfileOpen: boolean`

## Step 6 — Utils ของ feature

`src/features/chat/utils/` — ทุกตัวเป็น pure function เทสต์ง่าย ตรงกับที่ §11 ของแผนเดิมอยากให้เทสต์

- `format-time.ts` — ป้ายเวลาใน sidebar ตามดีไซน์: วันนี้ → `10:32`, เมื่อวาน → `เมื่อวาน`, ในสัปดาห์ → `จ.`, เก่ากว่านั้น → `14 ก.ย.` ใช้ `Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok' })`
- `initials.ts` — ชื่อไทยเอาอักษรแรก (`สมชาย ใจดี` → `ส`) ชื่อ latin เอาสองตัว (`Suda P.` → `SP`) ตามที่ดีไซน์ทำ
- `avatar-color.ts` — hash `userId` เลือกจาก 6 คู่สีใน Step 1 (deterministic ทั้ง server และ client)
- `message-preview.ts` — เติม `คุณ: ` หน้าข้อความที่เราส่ง ตามดีไซน์

> **เรื่อง hydration:** ป้ายเวลาพวกนี้ขึ้นกับ "วันนี้" ซึ่ง server กับ browser อาจไม่ตรงกัน v1 จึงไม่ prefetch ฝั่ง server — render แรกเป็น skeleton ตอนยังไม่มีข้อมูล เวลาจึงถูกคำนวณบน client เท่านั้น ไม่มี mismatch (ถ้าภายหลังจะเพิ่ม `HydrationBoundary` ต้องกลับมาคิดเรื่องนี้ใหม่)

## Step 7 — โครง console และ sidebar

```
src/app/
├─ page.tsx                 → redirect('/chat')
└─ chat/
   ├─ layout.tsx            NavRail + ConversationSidebar + {children}
   ├─ page.tsx              empty state
   └─ [userId]/page.tsx     ห้องแชท
```

- **`NavRail.tsx`** — แถบดำ 72px: โลโก้ "W" พื้น accent, ปุ่มแชท active (`#34372F`), ดัน logout ลงล่างด้วย spacer ทุกปุ่ม 44px มี `aria-label`
- **`ConversationSidebar.tsx`** (client) — กว้าง 340px พื้น raised: หัวข้อ "Conversations" + ตัวนับ unread, รายการ, และฟุตเตอร์ `SyncStatus` ("Webhook เชื่อมต่อแล้ว · sync 3s")
- **`ConversationRow.tsx`** — `<Link>` ไป `/chat/[userId]` พร้อม `aria-current="page"` ตอน active: avatar 44px, ชื่อ (หนา 700 เมื่อมี unread), เวลา mono, ข้อความล่าสุดตัดด้วย ellipsis, badge unread พื้น accent, badge "Unfollowed" แถวที่เลือกพื้น `#E4EEE7`
- states: skeleton ตอนโหลด, ข้อความเมื่อยังไม่มีใครทักเข้ามา, ข้อความเมื่อ query error

**Responsive** — mobile artboards บอกว่าต่ำกว่า `md` ให้แสดงทีละหน้า: `/chat` เห็นเฉพาะรายชื่อ, `/chat/[userId]` เห็นเฉพาะห้อง (มีปุ่มย้อนกลับใน header) ให้ `layout.tsx` render client component ที่ใช้ `useSelectedLayoutSegment()` ตัดสินว่าจะซ่อน sidebar ไหม บน `md` ขึ้นไปแสดงคู่กันตามปกติ nav rail ซ่อนบน mobile (ดีไซน์ mobile ไม่มี) แล้วย้าย logout ไปไว้มุมขวาบนของหน้ารายชื่อตาม MobileList

## Step 8 — ห้องแชท

- **`src/app/chat/page.tsx`** — ดีไซน์ไม่ได้วาดหน้านี้ไว้ จะทำตาม §6 ของแผนเดิมโดยใช้ภาษาเดียวกับ artboards อื่น: "ยังไม่มีข้อความ — แอด OA แล้วทักมาได้เลย" พร้อมกรอบ QR เส้นประและลิงก์จาก `NEXT_PUBLIC_LINE_OA_URL` (เหมือนบล็อกล่างของหน้า login)
- **`ChatHeader.tsx`** — สูง 72px พื้นขาว: avatar 40px, ชื่อ, จุดสถานะ + "กำลังติดตาม OA" (จุดแดง `#B3261E` + "เลิกติดตามแล้ว" เมื่อ unfollow), ปุ่ม toggle profile ชิดขวา บน mobile เพิ่มปุ่มย้อนกลับซ้ายสุด
- **`MessageList.tsx`** — `aria-live="polite"`, auto-scroll ลงล่างเมื่อเปิดห้องและเมื่อมีข้อความใหม่ (ดีไซน์เทียบจาก `selected + จำนวนข้อความ` — ลอกวิธีนั้นมา), chip "วันนี้" คั่นวัน
- **`MessageBubble.tsx`** — เข้า: ชิดซ้าย พื้นขาวมีเส้นขอบ มุม `18px 18px 18px 4px` มี avatar 28px ข้าง ๆ · ออก: ชิดขวา พื้น accent ตัวหนังสือขาว มุม `18px 18px 4px 18px` ทั้งคู่ `max-width: 68%` และ `white-space: pre-wrap`
  - `PENDING` → พื้น `#3E7A57` ป้าย "กำลังส่ง…" · `SENT` → "ส่งแล้ว" · `FAILED` → พื้น `#FBEAE8` หมึก `#7A1F17` ป้าย "ส่งไม่สำเร็จ" พร้อมปุ่ม "ส่งใหม่"
- **`Composer.tsx`** — textarea 2 แถวในกรอบ radius 16px, Enter ส่ง / Shift+Enter ขึ้นบรรทัด **และต้องข้ามตอน IME กำลังประกอบคำ** (`e.nativeEvent.isComposing` — สำคัญมากกับการพิมพ์ไทย ดีไซน์ก็เช็คไว้), ปุ่มส่งเป็นสีเทาตอนว่าง, บรรทัดล่าง "Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่" คู่กับ "Push API · n/5000", ผูก draft กับ zustand store
- **`UnfollowedNotice.tsx`** — เมื่อ `isFollowing === false` เปลี่ยน composer เป็นแถบเตือนสีส้ม "ผู้ใช้นี้เลิกติดตาม OA แล้ว จึงส่งข้อความหาไม่ได้จนกว่าจะเพิ่มเพื่อนอีกครั้ง"

## Step 9 — Profile panel

**`ProfilePanel.tsx`** — แถบขวา 300px พื้นขาว เปิดปิดด้วย `isProfileOpen` ใน zustand: avatar 88px, ชื่อ, status message ตัวเอียง (ไม่มีก็ "ไม่มีข้อความสถานะ"), `<dl>` แสดง LINE userId ในกล่อง mono + ปุ่มคัดลอกที่ขึ้น "คัดลอกแล้ว" 1.5 วินาที, สถานะ, วันที่เพิ่มเพื่อน, จำนวนข้อความในห้อง และหมายเหตุท้ายแผงว่าชื่อกับรูปดึงจาก Get Profile API ซ่อนแผงนี้บนจอเล็ก

## Step 10 — Login และการป้องกัน route

- **`src/app/login/page.tsx`** — สองคอลัมน์: ซ้าย 620px พื้นดำ (โลโก้, พาดหัว "ตอบแชทลูกค้าจาก LINE OA ได้จากหน้าเว็บเดียว", สามข้อ 01/02/03 เลข mono สี `#9FD1B2`, ฟุตเตอร์ "Next.js · Vercel · LINE Messaging API") ขวาเป็นฟอร์มกว้าง 400px พร้อมบล็อก QR เส้นประ + ลิงก์ OA บน mobile ซ้อนเป็นคอลัมน์เดียว
- **`LoginForm.tsx`** (client leaf) — input password + สถานะกำลังส่ง + ข้อความเมื่อรหัสผิด
- **`src/server/auth.ts`** — เซ็นและตรวจ session cookie ด้วย HMAC-SHA256 จาก `SESSION_SECRET` (`node:crypto`, ใช้ `timingSafeEqual`)
- **`src/app/api/auth/login/route.ts`** และ `logout/route.ts` — เทียบกับ `ADMIN_PASSWORD` แล้วตั้ง cookie `httpOnly` + `secure` + `sameSite=lax` ตาม §12 (`cookies()` เป็น async ใน Next 16)
- **`src/proxy.ts`** — Next 16 เปลี่ยนชื่อ middleware เป็น proxy แล้ว (ยืนยันจาก docs ในเครื่อง) กัน `/chat/*` และ `/api/conversations/*` โดยเว้น `/api/webhook` ไว้ให้ LINE ยิงเข้าได้ ตาม §12 ของแผนเดิม

---

## Verification

1. `npm run typecheck` · `npm run lint` · `npm run build` ต้องผ่านทั้งหมด
2. `npm run dev` แล้วไล่ดูตามนี้:
   - `/` เด้งไป `/chat` และ `/chat` ขึ้น empty state พร้อมกรอบ QR
   - คลิกผู้ใช้ใน sidebar → URL เป็น `/chat/<userId>` แถวถูกไฮไลต์ unread badge หาย และ refresh แล้วยังอยู่ห้องเดิม
   - พิมพ์แล้วกด Enter → bubble ขึ้นทันทีเป็น "กำลังส่ง…" แล้วเปลี่ยนเป็น "ส่งแล้ว" · Shift+Enter ขึ้นบรรทัดใหม่ · **พิมพ์ไทยด้วยคีย์บอร์ดไทยแล้ว Enter ตอนกำลังประกอบคำต้องไม่ส่งข้อความออกไป**
   - เลือก Mali W. (unfollow) → composer กลายเป็นแถบเตือน · ถ้าส่งได้แปลว่า guard ไม่ทำงาน
   - ทำให้ส่งไม่สำเร็จ (เช่นปิด network ใน devtools) → bubble แดง + ปุ่ม "ส่งใหม่" แล้วกดแล้วส่งซ้ำได้
   - กด toggle profile → แผงขวาเปิดปิด และปุ่มคัดลอก userId ขึ้น "คัดลอกแล้ว"
   - พิมพ์ค้างในห้องหนึ่ง สลับไปอีกห้อง แล้วกลับมา → ข้อความที่พิมพ์ค้างยังอยู่
   - เปิด devtools network → เห็น `/api/conversations` ยิงทุก ~3s และ `/messages` ทุก ~2s แล้วสลับไปแท็บอื่นต้องหยุดยิง
3. ย่อหน้าต่างเหลือ 390px → `/chat` เห็นเฉพาะรายชื่อ, เข้าห้องแล้วเห็นเฉพาะห้องพร้อมปุ่มย้อนกลับ, ไม่มี scroll แนวนอน
4. เข้า `/chat` ทั้งที่ยังไม่ login → เด้งไป `/login`, ใส่รหัสผิดเห็น error, ใส่ถูกเข้าได้
5. Accessibility: กด Tab ไล่ทั้งหน้าต้องเห็นกรอบ focus สีเขียวทุกจุด และเข้าถึงทุกอย่างที่กดได้โดยไม่ใช้เมาส์
6. ไม่มี hydration warning ใน console

## หลังจากนี้

เมื่อ UI นิ่งแล้ว Phase 1–3 ของ [implementation-plan.md](implementation-plan.md) คือการเปลี่ยน `src/server/mock/conversations.ts` เป็น Prisma repository และเพิ่ม `/api/webhook` กับ Push API — ถ้า UI ยึด shape ตาม Step 3 ไว้ ส่วน components และ hooks ไม่ต้องแก้เลย

หมายเหตุ: §7 (Folder Structure) ของแผนเดิมล้าสมัยไปแล้วตั้งแต่ตอน scaffold ควรอัปเดตให้ตรงกับโครง `features/` `shared/` `server/` ที่ใช้จริง และเพิ่มหมายเหตุว่า `middleware.ts` คือ `proxy.ts` บน Next 16
