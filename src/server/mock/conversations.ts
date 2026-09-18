import 'server-only';
import type { Conversation, Direction, Message, MessageType } from '@/features/chat/types';

/**
 * ที่เก็บข้อมูลชั่วคราวสำหรับพัฒนา UI — seed ด้วยชุดข้อมูลเดียวกับใน Design canvas
 *
 * เก็บใน module scope จึงใช้ได้เฉพาะตอน `next dev` เท่านั้น
 * บน Vercel แต่ละ invocation ไม่แชร์ memory กัน (docs/implementation-plan.md §2)
 * ไฟล์นี้จะถูกแทนด้วย Prisma repository ใน Phase 1 โดยคง signature เดิมไว้
 */

type StoredUser = {
  userId: string;
  displayName: string;
  pictureUrl: string | null;
  statusMessage: string | null;
  isFollowing: boolean;
  unreadCount: number;
  createdAt: string;
};

type Seed = { daysAgo: number; time: string };

/** แปลง "จำนวนวันก่อน + HH:MM" เป็น ISO string โดยอิงจากตอนที่ module ถูกโหลด */
function at({ daysAgo, time }: Seed): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const users: StoredUser[] = [
  {
    userId: 'U8f2c0d7e19b4a6c3b5d8e2f70a91c41d',
    displayName: 'สมชาย ใจดี',
    pictureUrl: null,
    statusMessage: 'ช้อปทุกวันศุกร์',
    isFollowing: true,
    unreadCount: 2,
    createdAt: at({ daysAgo: 6, time: '09:00' }),
  },
  {
    userId: 'U31b0e5a2c8d7f6140a93be25c7d17e92',
    displayName: 'Suda P.',
    pictureUrl: null,
    statusMessage: null,
    isFollowing: true,
    unreadCount: 0,
    createdAt: at({ daysAgo: 8, time: '11:00' }),
  },
  {
    userId: 'U5c9a1f03b7e24d8891c6f4a2e7d50b3c',
    displayName: 'ณัฐพงศ์ ศรีสุข',
    pictureUrl: null,
    statusMessage: 'Work hard, ship harder',
    isFollowing: true,
    unreadCount: 1,
    createdAt: at({ daysAgo: 10, time: '14:30' }),
  },
  {
    userId: 'U0e7d42a9c1b35f708e46a2c93b17d615',
    displayName: 'Ploy Chanakarn',
    pictureUrl: null,
    statusMessage: null,
    isFollowing: true,
    unreadCount: 0,
    createdAt: at({ daysAgo: 16, time: '10:15' }),
  },
  {
    userId: 'U7a13c6e0d2f98b41c05e7a39b6d452ae',
    displayName: 'กิตติศักดิ์ มั่นคง',
    pictureUrl: null,
    statusMessage: null,
    isFollowing: true,
    unreadCount: 1,
    createdAt: at({ daysAgo: 21, time: '16:40' }),
  },
  {
    userId: 'U2d68b1f4a09c7e35d81b0a63f27e9c07',
    displayName: 'Mali W.',
    pictureUrl: null,
    statusMessage: null,
    isFollowing: false,
    unreadCount: 0,
    createdAt: at({ daysAgo: 29, time: '13:20' }),
  },
];

type SeedMessage = {
  direction: Direction;
  type?: MessageType;
  text: string | null;
  seed: Seed;
};

function build(userId: string, seeds: SeedMessage[]): Message[] {
  return seeds.map((m, index) => ({
    id: `seed-${userId.slice(1, 7)}-${index}`,
    lineUserId: userId,
    direction: m.direction,
    type: m.type ?? 'text',
    text: m.text,
    status: 'SENT',
    error: null,
    sentAt: at(m.seed),
  }));
}

const messages: Message[] = [
  ...build(users[0]!.userId, [
    { direction: 'INBOUND', text: 'สวัสดีครับ', seed: { daysAgo: 0, time: '10:28' } },
    {
      direction: 'INBOUND',
      text: 'อยากสอบถามว่าเสื้อรุ่นใหม่มีไซซ์ XL ไหมครับ',
      seed: { daysAgo: 0, time: '10:28' },
    },
    {
      direction: 'OUTBOUND',
      text: 'สวัสดีค่ะคุณสมชาย มีไซซ์ XL ค่ะ ต้องการสีไหนคะ',
      seed: { daysAgo: 0, time: '10:30' },
    },
    {
      direction: 'OUTBOUND',
      text: 'ตอนนี้มีสีดำกับสีกรมท่านะคะ',
      seed: { daysAgo: 0, time: '10:30' },
    },
    { direction: 'INBOUND', text: 'สีดำครับ', seed: { daysAgo: 0, time: '10:31' } },
    {
      direction: 'INBOUND',
      text: 'ส่งภายในวันนี้ทันไหมครับ',
      seed: { daysAgo: 0, time: '10:32' },
    },
  ]),
  ...build(users[1]!.userId, [
    { direction: 'INBOUND', text: 'รับของแล้วนะคะ', seed: { daysAgo: 0, time: '10:02' } },
    {
      direction: 'OUTBOUND',
      text: 'ขอบคุณที่ใช้บริการค่ะ',
      seed: { daysAgo: 0, time: '10:04' },
    },
    { direction: 'INBOUND', text: 'ขอบคุณมากค่ะ', seed: { daysAgo: 0, time: '10:05' } },
  ]),
  ...build(users[2]!.userId, [
    {
      direction: 'OUTBOUND',
      text: 'สินค้าจัดส่งแล้วครับ เลขพัสดุอยู่ในอีเมลนะครับ',
      seed: { daysAgo: 0, time: '09:40' },
    },
    { direction: 'INBOUND', type: 'sticker', text: null, seed: { daysAgo: 0, time: '09:48' } },
  ]),
  ...build(users[3]!.userId, [
    { direction: 'INBOUND', text: 'ส่งของวันไหนคะ', seed: { daysAgo: 1, time: '16:20' } },
    {
      direction: 'OUTBOUND',
      text: 'จัดส่งพรุ่งนี้เช้าค่ะ',
      seed: { daysAgo: 1, time: '16:25' },
    },
  ]),
  ...build(users[4]!.userId, [
    { direction: 'INBOUND', type: 'image', text: null, seed: { daysAgo: 3, time: '14:10' } },
  ]),
  ...build(users[5]!.userId, [
    { direction: 'INBOUND', text: 'ขอยกเลิกออเดอร์ค่ะ', seed: { daysAgo: 14, time: '11:12' } },
    {
      direction: 'OUTBOUND',
      text: 'ยกเลิกให้เรียบร้อยแล้วค่ะ',
      seed: { daysAgo: 14, time: '11:20' },
    },
  ]),
];

/** ข้อความที่เก็บใน lastMessage — ชนิดที่ยังไม่รองรับจะถูกย่อเป็นป้ายกำกับ */
function toPreview(message: Message): string {
  if (message.type === 'text') return message.text ?? '';
  if (message.type === 'sticker') return '[สติกเกอร์]';
  if (message.type === 'image') return '[รูปภาพ]';
  return '[ไม่รองรับ]';
}

function messagesOf(userId: string): Message[] {
  return messages
    .filter((m) => m.lineUserId === userId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}

function toConversation(user: StoredUser): Conversation {
  const thread = messagesOf(user.userId);
  const last = thread[thread.length - 1];
  return {
    ...user,
    lastMessage: last ? toPreview(last) : null,
    lastMessageDirection: last?.direction ?? null,
    lastMessageAt: last?.sentAt ?? null,
  };
}

export function listConversations(): Conversation[] {
  return users
    .map(toConversation)
    .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''));
}

export function getConversation(userId: string): Conversation | null {
  const user = users.find((u) => u.userId === userId);
  return user ? toConversation(user) : null;
}

export function listMessages(userId: string): Message[] | null {
  return users.some((u) => u.userId === userId) ? messagesOf(userId) : null;
}

export function markAsRead(userId: string): Conversation | null {
  const user = users.find((u) => u.userId === userId);
  if (!user) return null;
  user.unreadCount = 0;
  return toConversation(user);
}

export type AppendResult =
  { ok: true; message: Message } | { ok: false; status: 404 | 409; error: string };

export function appendOutbound(userId: string, text: string): AppendResult {
  const user = users.find((u) => u.userId === userId);
  if (!user) return { ok: false, status: 404, error: 'ไม่พบผู้ใช้รายนี้' };
  if (!user.isFollowing) {
    return { ok: false, status: 409, error: 'ผู้ใช้เลิกติดตาม OA แล้ว จึงส่งข้อความไม่ได้' };
  }

  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lineUserId: userId,
    direction: 'OUTBOUND',
    type: 'text',
    text,
    status: 'SENT',
    error: null,
    sentAt: new Date().toISOString(),
  };
  messages.push(message);
  return { ok: true, message };
}
