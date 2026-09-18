'use client';

import { Fragment, useEffect, useRef } from 'react';
import type { Conversation, Message } from '../types';
import { dayKey, formatDayDivider } from '../utils/format-time';
import { MessageBubble } from './MessageBubble';

type MessageListProps = {
  messages: Message[];
  sender: Pick<Conversation, 'userId' | 'displayName' | 'pictureUrl'>;
  onRetry: (message: Message) => void;
};

export function MessageList({ messages, sender, onRetry }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // เลื่อนลงล่างสุดเมื่อเปิดห้องและเมื่อจำนวนข้อความเปลี่ยน
  // ผูกกับ length ไม่ใช่ array เพราะ polling สร้าง array ใหม่ทุกรอบ ซึ่งไม่ควรดึงหน้าจอลงมา
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sender.userId, messages.length]);

  return (
    <div
      ref={listRef}
      aria-live="polite"
      className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 md:px-8 md:py-6"
    >
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
