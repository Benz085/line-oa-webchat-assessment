import 'server-only';
import type { Message as MessageRow } from '@/generated/prisma/client';
import type { Message, MessageType } from '@/features/chat/types';
import { getPrisma } from '@/server/prisma';

export const DEFAULT_PAGE_SIZE = 30;

/**
 * PENDING ที่ค้างนานกว่านี้ = function ตายกลางทาง (timeout/redeploy) ก่อนจะบันทึกผล
 * แสดงเป็น FAILED เพื่อไม่ให้ค้าง "กำลังส่ง…" ตลอดกาล และเปิดให้กดส่งใหม่ได้
 * (ส่งใหม่ปลอดภัยเพราะใช้ retry key เดิม ถ้า LINE รับไปแล้วจะไม่ส่งซ้ำ)
 */
export const STALE_PENDING_MS = 60_000;

const STALE_PENDING_ERROR = 'ไม่ทราบผลการส่ง — กด "ส่งใหม่" ได้ ระบบกันข้อความซ้ำให้';

export function toMessage(row: MessageRow): Message {
  const stale = row.status === 'PENDING' && Date.now() - row.sentAt.getTime() > STALE_PENDING_MS;

  return {
    id: row.id,
    lineUserId: row.lineUserId,
    direction: row.direction,
    // webhook-handler เป็นคนเขียนคอลัมน์นี้ และเขียนแค่ 4 ค่าใน MessageType
    type: row.type as MessageType,
    text: row.text,
    status: stale ? 'FAILED' : row.status,
    error: stale ? STALE_PENDING_ERROR : row.error,
    sentAt: row.sentAt.toISOString(),
  };
}

export type MessagesPage = {
  /** เรียงเก่า → ใหม่ พร้อมแสดงได้เลย */
  messages: Message[];
  /** ส่งกลับมาเป็น `cursor` เพื่อขอหน้าที่เก่ากว่านี้ — null = ไม่มีแล้ว */
  nextCursor: string | null;
};

/**
 * Cursor pagination แบบย้อนหลัง: หน้าแรกคือข้อความล่าสุด `limit` ข้อความ
 * cursor = id ของข้อความที่เก่าสุดในหน้าก่อนหน้า
 *
 * เรียงด้วย (sentAt, id) เพื่อให้ลำดับคงที่แม้มีหลายข้อความเวลาเดียวกัน
 * ใช้ index [lineUserId, sentAt] ของ schema
 */
export async function listMessages(
  userId: string,
  { cursor, limit = DEFAULT_PAGE_SIZE }: { cursor?: string; limit?: number } = {},
): Promise<MessagesPage> {
  const rows = await getPrisma().message.findMany({
    where: { lineUserId: userId },
    orderBy: [{ sentAt: 'desc' }, { id: 'desc' }],
    // ขอเกินมา 1 แถวไว้ดูว่ายังมีหน้าเก่ากว่าไหม โดยไม่ต้อง count
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    messages: page.map(toMessage).reverse(),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

export function countMessages(userId: string): Promise<number> {
  return getPrisma().message.count({ where: { lineUserId: userId } });
}
