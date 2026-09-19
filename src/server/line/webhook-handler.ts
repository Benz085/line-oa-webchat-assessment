import type { webhook } from '@line/bot-sdk';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { formatBody } from '@/features/chat/utils/message-preview';

/**
 * Logic ล้วนของ webhook — รับ db กับ fetchProfile
 */

export type LineProfile = {
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

export type WebhookDeps = {
  db: PrismaClient;
  fetchProfile: (userId: string) => Promise<LineProfile | null>;
};

export type WebhookResult = { processed: number; duplicates: number; failed: number };

export const FALLBACK_DISPLAY_NAME = 'ผู้ใช้ LINE';

const LAST_MESSAGE_MAX_LENGTH = 200;

type EventOutcome = 'processed' | 'duplicate' | 'ignored';

export async function handleWebhookEvents(
  events: webhook.Event[],
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const result: WebhookResult = { processed: 0, duplicates: 0, failed: 0 };

  // เรียงตามลำดับที่ LINE ส่งมา และให้ error ของแต่ละ event จบแค่ event นั้น
  // ไม่ throw ทั้ง request เพื่อให้ตอบ 200 ได้เร็ว (§5 ข้อ 6)
  for (const event of events) {
    try {
      const outcome = await handleEvent(event, deps);
      if (outcome === 'processed') result.processed += 1;
      if (outcome === 'duplicate') result.duplicates += 1;
    } catch (error) {
      result.failed += 1;
      console.error('[webhook] event failed', {
        type: event.type,
        webhookEventId: event.webhookEventId,
        error,
      });
    }
  }

  return result;
}

async function handleEvent(event: webhook.Event, deps: WebhookDeps): Promise<EventOutcome> {
  // standby = OA อยู่ในโหมดที่มี module อื่นรับสายหลัก ไม่ใช่ event ที่เราต้องตอบ
  if (event.mode !== 'active') return 'ignored';
  // รองรับแชท 1:1 เท่านั้น (ไม่รวม group/room)
  if (event.source?.type !== 'user' || !event.source.userId) return 'ignored';

  const userId = event.source.userId;

  switch (event.type) {
    case 'follow':
      await upsertFollowedUser(userId, deps);
      return 'processed';
    case 'unfollow':
      // updateMany: ไม่ throw ถ้ายังไม่เคยมี user นี้ในระบบ
      await deps.db.lineUser.updateMany({ where: { id: userId }, data: { isFollowing: false } });
      return 'processed';
    case 'message':
      return (await saveInboundMessage(event, userId, deps)) ? 'processed' : 'duplicate';
    default:
      return 'ignored';
  }
}

async function upsertFollowedUser(userId: string, { db, fetchProfile }: WebhookDeps) {
  const profile = await fetchProfile(userId);
  const fields = profileFields(profile);

  await db.lineUser.upsert({
    where: { id: userId },
    create: { id: userId, ...fields, displayName: fields.displayName ?? FALLBACK_DISPLAY_NAME },
    // ดึงโปรไฟล์ไม่ได้ → อัปเดตแค่สถานะ ไม่เขียนทับชื่อเดิมด้วยค่าสำรอง
    update: { ...fields, isFollowing: true },
  });
}

/** ให้แน่ใจว่ามี user ก่อนแนบข้อความ โดยดึงโปรไฟล์เฉพาะตอนที่ยังไม่มีหรือได้แค่ชื่อสำรอง */
async function ensureUser(userId: string, { db, fetchProfile }: WebhookDeps) {
  const existing = await db.lineUser.findUnique({
    where: { id: userId },
    select: { displayName: true },
  });
  if (existing && existing.displayName !== FALLBACK_DISPLAY_NAME) return;

  const fields = profileFields(await fetchProfile(userId));
  await db.lineUser.upsert({
    where: { id: userId },
    create: { id: userId, ...fields, displayName: fields.displayName ?? FALLBACK_DISPLAY_NAME },
    update: fields,
  });
}

/** @returns false ถ้าเป็น event ซ้ำ (redelivery) ที่เคยบันทึกไปแล้ว */
async function saveInboundMessage(
  event: webhook.MessageEvent,
  userId: string,
  deps: WebhookDeps,
): Promise<boolean> {
  await ensureUser(userId, deps);

  const { message } = event;
  const type =
    message.type === 'text' || message.type === 'sticker' || message.type === 'image'
      ? message.type
      : 'unsupported';
  const text = message.type === 'text' ? message.text : null;
  const sentAt = new Date(event.timestamp);

  return deps.db.$transaction(async (tx) => {
    // skipDuplicates = ON CONFLICT DO NOTHING บน unique ของ webhookEventId/lineMessageId
    // จึงกันซ้ำได้แม้ LINE redeliver พร้อมกันหลาย request
    const { count } = await tx.message.createMany({
      data: [
        {
          lineUserId: userId,
          direction: 'INBOUND',
          type,
          text,
          // ข้อความที่ไม่ใช่ text เก็บ object ดิบไว้ (sticker id ฯลฯ) ให้ Phase หลังใช้แสดงผลได้
          payload: type === 'text' ? undefined : (message as Prisma.InputJsonObject),
          lineMessageId: message.id,
          webhookEventId: event.webhookEventId,
          status: 'SENT',
          sentAt,
        },
      ],
      skipDuplicates: true,
    });
    if (count === 0) return false;

    await tx.lineUser.update({
      where: { id: userId },
      data: {
        unreadCount: { increment: 1 },
        lastMessage: formatBody(type, text).slice(0, LAST_MESSAGE_MAX_LENGTH),
        lastMessageAt: sentAt,
        lastMessageDirection: 'INBOUND',
      },
    });
    return true;
  });
}

/** null = ดึงโปรไฟล์ไม่ได้ → คืน object ว่าง เพื่อไม่ไปทับข้อมูลเดิมด้วย undefined/ค่าสำรอง */
function profileFields(profile: LineProfile | null): {
  displayName?: string;
  pictureUrl?: string | null;
  statusMessage?: string | null;
} {
  if (!profile) return {};
  return {
    displayName: profile.displayName,
    // LINE ไม่ส่ง field นี้มาถ้า user ไม่มีรูป/สถานะ → เก็บเป็น null
    pictureUrl: profile.pictureUrl ?? null,
    statusMessage: profile.statusMessage ?? null,
  };
}
