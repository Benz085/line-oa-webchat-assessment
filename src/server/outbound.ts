import 'server-only';
import type { Message } from '@/features/chat/types';
import { formatBody } from '@/features/chat/utils/message-preview';
import { pushText, retryKeyFor } from '@/server/line/client';
import { STALE_PENDING_MS, toMessage } from '@/server/messages';
import { getPrisma } from '@/server/prisma';

export type SendResult =
  | { ok: true; message: Message; created: boolean }
  | { ok: false; status: 404 | 409; error: string };

const LAST_MESSAGE_MAX_LENGTH = 200;

/**
 * ส่งข้อความหาผู้ใช้: บันทึก PENDING → Push API → SENT / FAILED
 *
 * `messageId` มาจาก client และเป็น idempotency key ของทั้งกระบวนการ:
 * - id ใหม่ → สร้างแถว PENDING แล้วส่ง
 * - id เดิมที่ FAILED (หรือ PENDING ค้าง) → "ส่งใหม่ทับแถวเดิม" ด้วย text ที่เก็บใน DB
 * - id เดิมที่ SENT → คืนแถวเดิม ไม่ส่งซ้ำ
 *
 * ข้อความที่ LINE ปฏิเสธไม่ใช่ error ของ request นี้ — แถวถูกบันทึกเป็น FAILED แล้วคืน 200
 * ให้ UI แสดงสถานะจากข้อมูลจริงใน DB
 */
export async function sendTextMessage(input: {
  userId: string;
  messageId: string;
  text: string;
}): Promise<SendResult> {
  const { userId, messageId, text } = input;
  const db = getPrisma();

  const user = await db.lineUser.findUnique({
    where: { id: userId },
    select: { isFollowing: true },
  });
  if (!user) return { ok: false, status: 404, error: 'ไม่พบผู้ใช้รายนี้' };
  if (!user.isFollowing) {
    return { ok: false, status: 409, error: 'ผู้ใช้เลิกติดตาม OA แล้ว จึงส่งข้อความไม่ได้' };
  }

  const existing = await db.message.findUnique({ where: { id: messageId } });

  if (!existing) {
    const sentAt = new Date();
    // skipDuplicates: ถ้ามี request เดียวกันแทรกเข้ามาสร้างก่อน จะได้ count 0 แทน exception
    const { count } = await db.message.createMany({
      data: [
        {
          id: messageId,
          lineUserId: userId,
          direction: 'OUTBOUND',
          type: 'text',
          text,
          status: 'PENDING',
          sentAt,
        },
      ],
      skipDuplicates: true,
    });
    if (count === 0) return inFlight();

    return { ok: true, created: true, message: await deliver({ userId, messageId, text, sentAt }) };
  }

  // ป้องกันการใช้ id ของข้อความในห้องอื่นมาแตะข้อความที่ไม่ใช่ของห้องนี้
  if (existing.lineUserId !== userId || existing.direction !== 'OUTBOUND') {
    return { ok: false, status: 404, error: 'ไม่พบข้อความนี้' };
  }
  if (existing.status === 'SENT') {
    return { ok: true, created: false, message: toMessage(existing) };
  }

  // "จอง" แถวก่อนส่ง (compare-and-set) กันกดส่งใหม่รัว ๆ หรือสองแท็บพร้อมกัน
  // sentAt ขยับเป็นตอนนี้ เพื่อให้ลำดับในห้องตรงกับลำดับที่ลูกค้าเห็นใน LINE
  const sentAt = new Date();
  const staleBefore = new Date(sentAt.getTime() - STALE_PENDING_MS);
  const claimed = await db.message.updateMany({
    where: {
      id: messageId,
      OR: [{ status: 'FAILED' }, { status: 'PENDING', sentAt: { lt: staleBefore } }],
    },
    data: { status: 'PENDING', error: null, sentAt },
  });
  if (claimed.count === 0) return inFlight();

  // ใช้ text จาก DB ไม่ใช่จาก request — retry key เดิมต้องคู่กับเนื้อหาเดิมเท่านั้น
  const message = await deliver({ userId, messageId, text: existing.text ?? text, sentAt });
  return { ok: true, created: false, message };
}

function inFlight(): SendResult {
  return { ok: false, status: 409, error: 'ข้อความนี้กำลังถูกส่งอยู่' };
}

async function deliver(input: {
  userId: string;
  messageId: string;
  text: string;
  sentAt: Date;
}): Promise<Message> {
  const { userId, messageId, text, sentAt } = input;
  const db = getPrisma();

  const result = await pushText(userId, text, retryKeyFor(messageId));

  if (!result.ok) {
    const failed = await db.message.update({
      where: { id: messageId },
      data: { status: 'FAILED', error: result.error },
    });
    return toMessage(failed);
  }

  const [sent] = await db.$transaction([
    db.message.update({
      where: { id: messageId },
      data: { status: 'SENT', error: null, lineMessageId: result.lineMessageId },
    }),
    // อัปเดต preview ของ sidebar เฉพาะเมื่อข้อความนี้ใหม่กว่าข้อความล่าสุดเดิม
    // (ระหว่างรอ LINE อาจมีข้อความจากลูกค้าเข้ามาก่อน — ต้องไม่ถูกทับ)
    db.lineUser.updateMany({
      where: { id: userId, OR: [{ lastMessageAt: null }, { lastMessageAt: { lt: sentAt } }] },
      data: {
        lastMessage: formatBody('text', text).slice(0, LAST_MESSAGE_MAX_LENGTH),
        lastMessageAt: sentAt,
        lastMessageDirection: 'OUTBOUND',
      },
    }),
  ]);
  return toMessage(sent);
}
