'use client';

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useSendMessage } from '../hooks/useSendMessage';
import { useThread } from '../hooks/useMessages';
import { useChatStore } from '../stores/chat-store';
import { ChatHeader } from './ChatHeader';
import { Composer } from './Composer';
import { MessageList } from './MessageList';
import { ProfilePanel } from './ProfilePanel';
import { UnfollowedNotice } from './UnfollowedNotice';

type ChatRoomProps = {
  userId: string;
};

function RoomMessage({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-muted">{title}</p>
      {action}
    </div>
  );
}

export function ChatRoom({ userId }: ChatRoomProps) {
  const { messages, conversation, isPending, error, refetch } = useThread(userId);
  const { send, retry } = useSendMessage();
  const isProfileOpen = useChatStore((s) => s.isProfileOpen);

  useMarkAsRead(userId, conversation?.unreadCount ?? 0);

  if (isPending) {
    return <RoomMessage title="กำลังโหลดข้อความ…" />;
  }

  if (!conversation) {
    return (
      <RoomMessage
        title={error ? error.message : 'ไม่พบผู้ใช้รายนี้'}
        action={
          error ? (
            <button
              type="button"
              onClick={() => refetch()}
              className="h-9 rounded-lg border border-edge-strong bg-surface px-4 text-sm font-medium"
            >
              ลองใหม่
            </button>
          ) : (
            <Link href={ROUTES.chat} className="text-sm font-medium text-accent">
              กลับไปรายชื่อ
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col">
        <ChatHeader conversation={conversation} />
        <MessageList messages={messages} sender={conversation} onRetry={retry} />

        {conversation.isFollowing ? (
          <Composer
            userId={userId}
            displayName={conversation.displayName}
            onSend={(text) => send(userId, text)}
          />
        ) : (
          <UnfollowedNotice />
        )}
      </section>

      {isProfileOpen && <ProfilePanel conversation={conversation} messageCount={messages.length} />}
    </div>
  );
}
