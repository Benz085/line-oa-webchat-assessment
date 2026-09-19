import 'server-only';
import type { LineUser } from '@/generated/prisma/client';
import type { Conversation } from '@/features/chat/types';
import { getPrisma } from '@/server/prisma';

function toConversation(user: LineUser): Conversation {
  return {
    userId: user.id,
    displayName: user.displayName,
    pictureUrl: user.pictureUrl,
    statusMessage: user.statusMessage,
    isFollowing: user.isFollowing,
    unreadCount: user.unreadCount,
    lastMessage: user.lastMessage,
    lastMessageDirection: user.lastMessageDirection,
    lastMessageAt: user.lastMessageAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

/** ห้องที่คุยล่าสุดขึ้นก่อน — คนที่แอดแล้วแต่ยังไม่เคยทักไปอยู่ท้ายสุด */
export async function listConversations(): Promise<Conversation[]> {
  const users = await getPrisma().lineUser.findMany({
    orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
  });
  return users.map(toConversation);
}

export async function getConversation(userId: string): Promise<Conversation | null> {
  const user = await getPrisma().lineUser.findUnique({ where: { id: userId } });
  return user ? toConversation(user) : null;
}

export async function markAsRead(userId: string): Promise<Conversation | null> {
  // updateMany: ไม่ throw ถ้าไม่มี user นี้ จะได้ตอบ 404 เองได้
  const { count } = await getPrisma().lineUser.updateMany({
    where: { id: userId },
    data: { unreadCount: 0 },
  });
  return count === 0 ? null : getConversation(userId);
}
