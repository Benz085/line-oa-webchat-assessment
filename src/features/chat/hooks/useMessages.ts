import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMessages } from '../api';
import { chatKeys } from '../query-keys';
import { useChatStore } from '../stores/chat-store';
import type { Message } from '../types';

/** poll ห้องที่เปิดอยู่ทุก 2 วินาที ตาม docs/implementation-plan.md §6 */
export const MESSAGES_POLL_MS = 2000;

const EMPTY: Message[] = [];

export function useMessages(userId: string) {
  return useQuery({
    queryKey: chatKeys.messages(userId),
    queryFn: () => fetchMessages(userId),
    refetchInterval: MESSAGES_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/**
 * ข้อความของห้อง = ข้อความจาก server + ข้อความใน outbox ที่ยังส่งไม่เสร็จ/ล้มเหลว
 * (ดูเหตุผลที่แยก outbox ได้ที่ chat-store.ts)
 */
export function useThread(userId: string) {
  const query = useMessages(userId);
  const outbox = useChatStore((s) => s.outbox[userId]) ?? EMPTY;

  const messages = useMemo(
    () => [...(query.data?.messages ?? EMPTY), ...outbox],
    [query.data?.messages, outbox],
  );

  return { ...query, messages, conversation: query.data?.conversation ?? null };
}
