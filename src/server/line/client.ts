import 'server-only';
import { createHash } from 'node:crypto';
import { HTTPFetchError, messagingApi } from '@line/bot-sdk';
import { getLineEnv } from '@/config/env.server';
import type { LineProfile } from '@/server/line/webhook-handler';

let client: messagingApi.MessagingApiClient | undefined;

export function getLineClient() {
  return (client ??= new messagingApi.MessagingApiClient({
    channelAccessToken: getLineEnv().LINE_CHANNEL_ACCESS_TOKEN,
  }));
}

/**
 * ดึงโปรไฟล์ผู้ใช้ — คืน null เมื่อล้มเหลว (เช่น network, rate limit)
 * เพื่อไม่ให้ข้อความที่เข้ามาหายเพียงเพราะโปรไฟล์ดึงไม่ได้
 */
export async function fetchLineProfile(userId: string): Promise<LineProfile | null> {
  try {
    return await getLineClient().getProfile(userId);
  } catch (error) {
    console.error('[line] getProfile failed', { userId, error });
    return null;
  }
}

/**
 * X-Line-Retry-Key ต้องเป็น UUID และต้อง "เหมือนเดิมทุกครั้ง" ที่ส่งข้อความเดียวกันซ้ำ
 * จึงคำนวณจาก message id แทนการสุ่ม — ถ้า LINE รับคำขอแรกไปแล้วแต่เราไม่ได้รับผลตอบกลับ
 * การกดส่งใหม่จะได้ 409 (ไม่ส่งซ้ำ) แทนที่จะเด้งเข้ามือถือลูกค้าสองรอบ
 */
export function retryKeyFor(messageId: string): string {
  const hex = createHash('sha256').update(`line-oa-webchat:push:${messageId}`).digest('hex');
  // จัดรูปเป็น UUID v4 (version nibble = 4, variant = 8-b)
  const variant = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

export type PushResult = { ok: true; lineMessageId?: string } | { ok: false; error: string };

export async function pushText(to: string, text: string, retryKey: string): Promise<PushResult> {
  try {
    const response = await getLineClient().pushMessage(
      { to, messages: [{ type: 'text', text }] },
      retryKey,
    );
    return { ok: true, lineMessageId: response.sentMessages[0]?.id };
  } catch (error) {
    // 409 = LINE เคยรับคำขอที่ใช้ retry key นี้ไปแล้ว → ข้อความถึงลูกค้าแล้ว ไม่ต้องส่งซ้ำ
    if (error instanceof HTTPFetchError && error.status === 409) return { ok: true };

    console.error('[line] push failed', {
      to,
      status: error instanceof HTTPFetchError ? error.status : undefined,
      body: error instanceof HTTPFetchError ? error.body : undefined,
      error: error instanceof HTTPFetchError ? undefined : error,
    });
    return { ok: false, error: describePushError(error) };
  }
}

/** ข้อความที่แอดมินอ่านเข้าใจ — เก็บลง Message.error และแสดงใต้ bubble */
function describePushError(error: unknown): string {
  if (!(error instanceof HTTPFetchError)) return 'เชื่อมต่อ LINE ไม่สำเร็จ ลองส่งใหม่อีกครั้ง';

  const { status } = error;
  if (status === 401 || status === 403) return 'Channel access token ไม่ถูกต้องหรือหมดอายุ';
  if (status === 429) return 'โควต้าข้อความของ OA เต็ม หรือส่งถี่เกินไป (LINE 429)';
  if (status >= 500) return 'LINE ขัดข้องชั่วคราว ลองส่งใหม่อีกครั้ง';

  return `LINE ปฏิเสธคำขอ (${status})${lineErrorDetail(error.body)}`;
}

function lineErrorDetail(body: string): string {
  try {
    const { message } = JSON.parse(body) as { message?: unknown };
    return typeof message === 'string' ? `: ${message}` : '';
  } catch {
    return '';
  }
}
