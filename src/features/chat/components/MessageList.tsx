'use client';

import { Fragment, useEffect, useLayoutEffect, useRef } from 'react';
import type { Conversation, Message } from '../types';
import { dayKey, formatDayDivider } from '../utils/format-time';
import { MessageBubble } from './MessageBubble';

type MessageListProps = {
  messages: Message[];
  sender: Pick<Conversation, 'userId' | 'displayName' | 'pictureUrl'>;
  onRetry: (message: Message) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<unknown>;
};

export function MessageList({
  messages,
  sender,
  onRetry,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  // scrollHeight ก่อนโหลดหน้าที่เก่ากว่า — ไว้ชดเชยไม่ให้หน้าจอกระโดดตอนข้อความถูกแทรกด้านบน
  const heightBeforeLoad = useRef<number | null>(null);

  const firstId = messages[0]?.id;
  const lastId = messages[messages.length - 1]?.id;

  // เลื่อนลงล่างสุดเมื่อเปิดห้องและเมื่อมีข้อความ "ท้ายสุด" เปลี่ยน (ข้อความใหม่/เพิ่งส่ง)
  // ผูกกับ id ท้ายสุด ไม่ใช่ length: การโหลดหน้าเก่าเพิ่ม length แต่ต้องไม่ดึงหน้าจอลงล่าง
  // และ polling สร้าง array ใหม่ทุกรอบซึ่งก็ไม่ควรดึงเช่นกัน
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sender.userId, lastId]);

  // ข้อความเก่าถูกแทรกด้านบน → ขยับ scrollTop ตามความสูงที่เพิ่มขึ้น ให้ผู้ใช้ยังอยู่ที่ข้อความเดิม
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && heightBeforeLoad.current !== null) {
      el.scrollTop += el.scrollHeight - heightBeforeLoad.current;
      heightBeforeLoad.current = null;
    }
  }, [firstId]);

  // โหลดจบแล้วแต่ไม่มีอะไรเพิ่ม (firstId ไม่เปลี่ยน) → ล้างค่าที่จองไว้ ไม่ให้ไปชดเชยผิดรอบหน้า
  useEffect(() => {
    if (!isLoadingMore) heightBeforeLoad.current = null;
  }, [isLoadingMore]);

  function loadMore() {
    heightBeforeLoad.current = listRef.current?.scrollHeight ?? null;
    void onLoadMore();
  }

  return (
    <div
      ref={listRef}
      aria-live="polite"
      className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 md:px-8 md:py-6"
    >
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={isLoadingMore}
          className="self-center rounded-full border border-edge-strong bg-surface px-4 py-1.5 text-xs font-medium disabled:text-muted"
        >
          {isLoadingMore ? 'กำลังโหลด…' : 'โหลดข้อความเก่ากว่า'}
        </button>
      )}

      {messages.length === 0 && (
        <p className="m-auto text-sm text-muted">ยังไม่มีข้อความในห้องนี้</p>
      )}

      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const isNewDay = !previous || dayKey(previous.sentAt) !== dayKey(message.sentAt);

        return (
          <Fragment key={message.id}>
            {isNewDay && (
              <div className="my-1.5 self-center rounded-full bg-chip px-3 py-1 text-xs text-muted">
                {formatDayDivider(message.sentAt)}
              </div>
            )}
            <MessageBubble message={message} sender={sender} onRetry={onRetry} />
          </Fragment>
        );
      })}
    </div>
  );
}
