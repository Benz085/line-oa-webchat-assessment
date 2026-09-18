'use client';

import { useSelectedLayoutSegment } from 'next/navigation';
import { cn } from '@/shared/utils/cn';
import { ConversationSidebar } from './ConversationSidebar';

type ChatShellProps = {
  rail: React.ReactNode;
  mobileAction?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * เดสก์ท็อป: rail + รายชื่อ + ห้องแชท แสดงคู่กัน
 * mobile: แสดงทีละหน้า — /chat เห็นเฉพาะรายชื่อ, /chat/[userId] เห็นเฉพาะห้อง
 *
 * segment ของ layout นี้คือ userId เมื่ออยู่ในห้อง และเป็น null ที่ /chat
 */
export function ChatShell({ rail, mobileAction, children }: ChatShellProps) {
  const activeUserId = useSelectedLayoutSegment();
  const inRoom = activeUserId !== null;

  return (
    <div className="flex h-dvh overflow-hidden bg-paper">
      <div className="hidden md:block">{rail}</div>

      <ConversationSidebar
        activeUserId={activeUserId}
        mobileAction={mobileAction}
        className={inRoom ? 'hidden md:flex' : 'flex'}
      />

      <main className={cn('min-w-0 flex-1 flex-col', inRoom ? 'flex' : 'hidden md:flex')}>
        {children}
      </main>
    </div>
  );
}
