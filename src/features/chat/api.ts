import type { Conversation, Message } from './types';

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

export async function fetchMessages(
  userId: string,
): Promise<{ messages: Message[]; conversation: Conversation | null }> {
  return request(`/api/conversations/${encodeURIComponent(userId)}/messages`);
}

export async function sendMessage(userId: string, text: string): Promise<Message> {
  const data = await request<{ message: Message }>(
    `/api/conversations/${encodeURIComponent(userId)}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
  );
  return data.message;
}

export async function markAsRead(userId: string): Promise<void> {
  await request(`/api/conversations/${encodeURIComponent(userId)}/read`, { method: 'POST' });
}
