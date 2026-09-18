'use client';

import Link from 'next/link';
import { Avatar } from '@/shared/components/ui/Avatar';
import { ChevronLeftIcon, PanelRightIcon } from '@/shared/components/ui/icons';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import { useChatStore } from '../stores/chat-store';
import type { Conversation } from '../types';

type ChatHeaderProps = {
  conversation: Conversation;
};

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const isProfileOpen = useChatStore((s) => s.isProfileOpen);
  const toggleProfile = useChatStore((s) => s.toggleProfile);
  const { userId, displayName, pictureUrl, isFollowing } = conversation;

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-edge bg-surface px-2 md:px-6">
      <Link
        href={ROUTES.chat}
        aria-label="กลับไปรายชื่อ"
        className="flex size-11 items-center justify-center rounded-xl md:hidden"
      >
        <ChevronLeftIcon size={22} />
      </Link>

      <Avatar userId={userId} displayName={displayName} pictureUrl={pictureUrl} size={40} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="truncate text-[17px] font-semibold">{displayName}</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span
            aria-hidden="true"
            className={cn('size-[7px] rounded-full', isFollowing ? 'bg-accent' : 'bg-danger')}
          />
          {isFollowing ? 'กำลังติดตาม OA' : 'เลิกติดตามแล้ว'}
        </span>
      </div>

      <button
        type="button"
        onClick={toggleProfile}
        aria-label="แสดง/ซ่อนโปรไฟล์ผู้ใช้"
        aria-pressed={isProfileOpen}
        className={cn(
          'hidden size-11 items-center justify-center rounded-xl border border-edge xl:flex',
          isProfileOpen ? 'bg-chip' : 'bg-surface',
        )}
      >
        <PanelRightIcon />
      </button>
    </header>
  );
}
