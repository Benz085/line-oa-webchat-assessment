import { validateSignature, type webhook } from '@line/bot-sdk';
import { getLineEnv } from '@/config/env.server';
import { fetchLineProfile } from '@/server/line/client';
import { handleWebhookEvents } from '@/server/line/webhook-handler';
import { getPrisma } from '@/server/prisma';

// ใช้ node:crypto (validateSignature) และ pg driver จึงต้องเป็น Node runtime
export const runtime = 'nodejs';

/**
 * LINE ยิงมาที่นี่ — ไม่มี session cookie ยืนยันตัวตนด้วย x-line-signature แทน
 * (proxy.ts ไม่ครอบ path นี้)
 */
export async function POST(request: Request) {
  // ต้องอ่านเป็น text ก่อน: signature คำนวณจาก raw body ทุก byte
  // ถ้า req.json() แล้ว stringify กลับ ผลจะไม่ตรงและ verify ไม่ผ่าน
  const body = await request.text();
  const signature = request.headers.get('x-line-signature');

  if (!signature || !validateSignature(body, getLineEnv().LINE_CHANNEL_SECRET, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let events: webhook.Event[];
  try {
    const parsed: unknown = JSON.parse(body);
    const raw = (parsed as { events?: unknown } | null)?.events;
    events = Array.isArray(raw) ? (raw as webhook.Event[]) : [];
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // events ว่าง = ปุ่ม Verify ใน LINE Developers Console → ตอบ 200 โดยไม่แตะ DB
  if (events.length === 0) return Response.json({ ok: true });

  const result = await handleWebhookEvents(events, {
    db: getPrisma(),
    fetchProfile: fetchLineProfile,
  });
  return Response.json({ ok: true, ...result });
}
