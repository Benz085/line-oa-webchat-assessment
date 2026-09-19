import 'server-only';
import { messagingApi } from '@line/bot-sdk';
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
