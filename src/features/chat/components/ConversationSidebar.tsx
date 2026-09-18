'use client';

import { cn } from '@/shared/utils/cn';
import { CONVERSATIONS_POLL_MS, useConversations } from '../hooks/useConversations';
import { ConversationRow } from './ConversationRow';

type ConversationSidebarProps = {
  activeUserId: string | null;
  /** ปุ่มมุมขวาบนที่แสดงเฉพาะ mobile (ออกจากระบบ) */
  mobileAction?: React.ReactNode;
  className?: string;
};

function RowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-2.5 py-3" aria-hidden="true">
      <div className="size-11 shrink-0 rounded-full bg-chip" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3.5 w-2/5 rounded bg-chip" />
        <div className="h-3 w-4/5 rounded bg-chip" />
      </div>
    </div>
  );
}

export function ConversationSidebar({
  activeUserId,
  mobileAction,
  className,
}: ConversationSidebarProps) {
  const { data, isPending, isError, refetch } = useConversations();

  const conversations = data ?? [];
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <aside
      aria-label="รายชื่อผู้ใช้"
      className={cn(
        'w-full shrink-0 flex-col border-r border-edge bg-raised md:w-[340px]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3 md:px-5 md:pt-[22px]">
        <h1 className="font-display text-[26px] font-bold md:text-[22px] md:tracking-[-0.01em]">
          <span className="md:hidden">แชท</span>
          <span className="hidden md:inline">Conversations</span>
        </h1>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">{unreadTotal} unread</span>
          <div className="md:hidden">{mobileAction}</div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3 md:px-2.5">
        {isPending && (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        )}

        {isError && (
          <div className="m-4 flex flex-col items-center gap-3 text-center text-sm text-muted">
            <p>โหลดรายชื่อไม่สำเร็จ</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="h-9 rounded-lg border border-edge-strong bg-surface px-4 text-sm font-medium text-ink"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {data && conversations.length === 0 && (
          <p className="m-6 text-center text-sm text-muted">
            ยังไม่มีข้อความ — แอด OA แล้วทักมาได้เลย
          </p>
        )}

        {conversations.map((conversation) => (
          <ConversationRow
            key={conversation.userId}
            conversation={conversation}
            active={conversation.userId === activeUserId}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-edge px-5 py-3 text-xs text-muted">
        <span
          aria-hidden="true"
          className={cn('size-2 rounded-full', isError ? 'bg-danger' : 'bg-accent')}
        />
        <span>{isError ? 'เชื่อมต่อไม่ได้ กำลังลองใหม่' : 'เชื่อมต่อแล้ว'}</span>
        <span className="flex-1" />
        <span className="font-mono">sync {CONVERSATIONS_POLL_MS / 1000}s</span>
      </div>
    </aside>
  );
}
