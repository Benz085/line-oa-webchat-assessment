import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchMessages } from '../api';
import { chatKeys } from '../query-keys';
import { useChatStore } from '../stores/chat-store';
import type { Message } from '../types';
import { mergeThread } from '../utils/merge-thread';

/** poll ห้องที่เปิดอยู่ทุก 2 วินาที ตาม docs/implementation-plan.md §6 */
export const MESSAGES_POLL_MS = 2000;

const EMPTY: Message[] = [];

/**
 * pages[0] = ข้อความล่าสุด, pages[1..] = หน้าที่เก่ากว่าตามที่กด "โหลดข้อความเก่ากว่า"
 *
 * polling จะ refetch ทุกหน้าที่โหลดไว้ตามลำดับ และคำนวณ cursor ใหม่จากหน้าก่อนหน้าทุกรอบ
 * ข้อความใหม่ที่เข้ามาจึงไม่ทำให้เกิดช่องว่างระหว่างหน้า (แลกกับจำนวน request ที่เพิ่มตามหน้าที่โหลด)
 */
export function useMessages(userId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(userId),
    queryFn: ({ pageParam }) => fetchMessages(userId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: MESSAGES_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/**
 * ข้อความของห้อง = ข้อความจาก server + ข้อความใน outbox ที่ยังไม่ถึง server
 * (ดูเหตุผลและกฎการรวมที่ merge-thread.ts)
 */
export function useThread(userId: string) {
  const query = useMessages(userId);
  const outbox = useChatStore((s) => s.outbox[userId]) ?? EMPTY;

  const pages = query.data?.pages;
  const messages = useMemo(() => mergeThread(pages, outbox), [pages, outbox]);
  const firstPage = pages?.[0];

  return {
    ...query,
    messages,
    conversation: firstPage?.conversation ?? null,
    // จำนวนทั้งหมดใน DB ไม่ใช่เฉพาะที่โหลดมา
    messageCount: firstPage?.messageCount ?? messages.length,
  };
}
