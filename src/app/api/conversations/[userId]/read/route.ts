import { isAuthenticated, unauthorized } from '@/server/auth';
import { markAsRead } from '@/server/mock/conversations';

type Context = { params: Promise<{ userId: string }> };

export async function POST(_request: Request, { params }: Context) {
  if (!(await isAuthenticated())) return unauthorized();

  const { userId } = await params;
  const conversation = markAsRead(userId);

  if (!conversation) {
    return Response.json({ error: 'ไม่พบผู้ใช้รายนี้' }, { status: 404 });
  }

  return Response.json({ conversation });
}
