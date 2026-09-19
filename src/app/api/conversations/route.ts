import { isAuthenticated, unauthorized } from '@/server/auth';
import { listConversations } from '@/server/conversations';

export async function GET() {
  if (!(await isAuthenticated())) return unauthorized();

  return Response.json({ conversations: await listConversations() });
}
