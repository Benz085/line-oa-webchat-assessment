import type { Conversation, Message, MessagesResponse } from './types';

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `คำขอไม่สำเร็จ (${res.status})`;
    throw new Error(message);
  }

  return body as T;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const data = await request<{ conversations: Conversation[] }>('/api/conversations');
  return data.conversations;
}

/** ไม่ส่ง cursor = หน้าล่าสุด; ส่ง nextCursor ของหน้าก่อนหน้า = หน้าที่เก่ากว่า */
export async function fetchMessages(userId: string, cursor?: string): Promise<MessagesResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return request(`/api/conversations/${encodeURIComponent(userId)}/messages${query}`);
}

/**
 * ส่ง id เดิมซ้ำ = "ส่งใหม่" ข้อความเดิม (server ทับแถวเดิมและกันส่งซ้ำให้)
 * ผลการส่งจริงอยู่ที่ message.status — ถ้า LINE ปฏิเสธจะได้ FAILED กลับมา ไม่ throw
 */
export async function sendMessage(userId: string, id: string, text: string): Promise<Message> {
  const data = await request<{ message: Message }>(
    `/api/conversations/${encodeURIComponent(userId)}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text }),
    },
  );
  return data.message;
}

export async function markAsRead(userId: string): Promise<void> {
  await request(`/api/conversations/${encodeURIComponent(userId)}/read`, { method: 'POST' });
}
