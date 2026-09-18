import { sendMessageSchema } from '@/features/chat/schemas';
import { isAuthenticated, unauthorized } from '@/server/auth';
import { appendOutbound, getConversation, listMessages } from '@/server/mock/conversations';

type Context = { params: Promise<{ userId: string }> };

/** หน่วงให้เห็นสถานะ "กำลังส่ง" ชัด ๆ — ของจริงคือเวลาที่รอ LINE Push API */
const MOCK_PUSH_DELAY_MS = 600;

export async function GET(_request: Request, { params }: Context) {
  if (!(await isAuthenticated())) return unauthorized();

  const { userId } = await params;
  const messages = listMessages(userId);

  if (!messages) {
    return Response.json({ error: 'ไม่พบผู้ใช้รายนี้' }, { status: 404 });
  }

  return Response.json({ messages, conversation: getConversation(userId) });
}

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

  await new Promise((resolve) => setTimeout(resolve, MOCK_PUSH_DELAY_MS));

  const result = appendOutbound(userId, parsed.data.text);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ message: result.message }, { status: 201 });
}
