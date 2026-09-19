import Link from 'next/link';
import { Avatar } from '@/shared/components/ui/Avatar';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import type { Conversation } from '../types';
import { formatConversationTime } from '../utils/format-time';
import { formatPreview } from '../utils/message-preview';

type ConversationRowProps = {
  conversation: Conversation;
  active: boolean;
};

export function ConversationRow({ conversation, active }: ConversationRowProps) {
  const { userId, displayName, pictureUrl, unreadCount, isFollowing, lastMessageAt } = conversation;
  const hasUnread = unreadCount > 0;

  return (
    <Link
      href={ROUTES.chatRoom(userId)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl px-2.5 py-3 text-ink',
        active ? 'bg-selected' : 'hover:bg-chip/60',
      )}
    >
      <Avatar userId={userId} displayName={displayName} pictureUrl={pictureUrl} size={44} />

      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate text-[15px]', hasUnread ? 'font-bold' : 'font-medium')}>
            {displayName}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-muted">
            {formatConversationTime(lastMessageAt)}
          </span>
        </span>

        <span className="flex items-center justify-between gap-2">
          <span className={cn('truncate text-[13px]', hasUnread ? 'text-ink' : 'text-muted')}>
            {formatPreview(conversation)}
          </span>
          {hasUnread && (
            <span
              aria-label={`ยังไม่อ่าน ${unreadCount} ข้อความ`}
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white"
            >
              {unreadCount}
            </span>
          )}
          {!isFollowing && (
            <span className="shrink-0 rounded-md bg-warn-badge px-1.5 py-0.5 text-[11px] text-warn-ink">
              Unfollowed
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
