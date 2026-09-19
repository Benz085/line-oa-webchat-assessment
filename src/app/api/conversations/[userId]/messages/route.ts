import { listMessagesQuerySchema, sendMessageSchema } from '@/features/chat/schemas';
import type { MessagesResponse } from '@/features/chat/types';
import { isAuthenticated, unauthorized } from '@/server/auth';
import { getConversation } from '@/server/conversations';
import { countMessages, listMessages } from '@/server/messages';
import { sendTextMessage } from '@/server/outbound';

type Context = { params: Promise<{ userId: string }> };

export async function GET(request: Request, { params }: Context) {
  if (!(await isAuthenticated())) return unauthorized();

  const { userId } = await params;

  const query = listMessagesQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) {
    return Response.json({ error: 'พารามิเตอร์ไม่ถูกต้อง' }, { status: 400 });
  }
  const { cursor, limit } = query.data;

  // หน้าแรกพ่วงข้อมูลห้อง (header/โปรไฟล์) มาด้วย หน้าที่เก่ากว่าไม่ต้อง
  const [page, conversation, messageCount] = await Promise.all([
    listMessages(userId, { cursor, limit }),
    cursor ? null : getConversation(userId),
    cursor ? null : countMessages(userId),
  ]);

  if (!cursor && !conversation) {
    return Response.json({ error: 'ไม่พบผู้ใช้รายนี้' }, { status: 404 });
  }

  return Response.json({ ...page, conversation, messageCount } satisfies MessagesResponse);
}

/**
 * ส่งข้อความ หรือ "ส่งใหม่" ข้อความเดิม (ส่ง id เดิมมาซ้ำ) — ดูรายละเอียดที่ sendTextMessage
 * 201 = สร้างแถวใหม่, 200 = ใช้แถวเดิม; สถานะจริงของการส่งอยู่ที่ message.status
 */
export async function POST(request: Request, { params }: Context) {
  if (!(await isAuthenticated())) return unauthorized();

  const { userId } = await params;

  const body: unknown = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'ข้อความไม่ถูกต้อง' },
      { status: 400 },
    );
  }

  const result = await sendTextMessage({
    userId,
    messageId: parsed.data.id,
    text: parsed.data.text,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ message: result.message }, { status: result.created ? 201 : 200 });
}
