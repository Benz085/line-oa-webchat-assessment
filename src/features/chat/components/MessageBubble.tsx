import { Avatar } from '@/shared/components/ui/Avatar';
import { RotateCwIcon } from '@/shared/components/ui/icons';
import { cn } from '@/shared/utils/cn';
import type { Conversation, Message, MessageStatus } from '../types';
import { formatClock } from '../utils/format-time';
import { formatBody } from '../utils/message-preview';

type MessageBubbleProps = {
  message: Message;
  sender: Pick<Conversation, 'userId' | 'displayName' | 'pictureUrl'>;
  onRetry: (message: Message) => void;
};

const STATUS_LABEL: Record<MessageStatus, string> = {
  PENDING: 'กำลังส่ง…',
  SENT: 'ส่งแล้ว',
  FAILED: 'ส่งไม่สำเร็จ',
};

function InboundBubble({ message, sender }: Pick<MessageBubbleProps, 'message' | 'sender'>) {
  const isText = message.type === 'text';

  return (
    <div className="flex max-w-[80%] items-end gap-2 md:max-w-[68%]">
      <Avatar
        userId={sender.userId}
        displayName={sender.displayName}
        pictureUrl={sender.pictureUrl}
        size={28}
        className="hidden md:flex"
      />
      <div className="flex min-w-0 flex-col items-start gap-1">
        <div
          className={cn(
            'rounded-[18px_18px_18px_4px] px-3.5 py-2.5 text-[15px] leading-[1.55] break-words whitespace-pre-wrap',
            isText ? 'border border-edge bg-surface' : 'bg-unsupported text-[13px] text-muted',
          )}
        >
          {formatBody(message.type, message.text)}
        </div>
        <span className="pl-1 font-mono text-[11px] text-muted">{formatClock(message.sentAt)}</span>
      </div>
    </div>
  );
}

function OutboundBubble({ message, onRetry }: Pick<MessageBubbleProps, 'message' | 'onRetry'>) {
  const { status } = message;
  const failed = status === 'FAILED';

  return (
    <div className="flex max-w-[80%] flex-col items-end gap-1 self-end md:max-w-[68%]">
      <div
        className={cn(
          'rounded-[18px_18px_4px_18px] border px-3.5 py-2.5 text-[15px] leading-[1.55] break-words whitespace-pre-wrap',
          failed && 'border-danger-edge bg-danger-bg text-danger-ink',
          status === 'PENDING' && 'border-transparent bg-accent-pending text-white',
          status === 'SENT' && 'border-transparent bg-accent text-white',
        )}
      >
        {formatBody(message.type, message.text)}
      </div>

      <span className="flex items-center gap-2 pr-1 text-[11px]">
        {failed && (
          <button
            type="button"
            onClick={() => onRetry(message)}
            className="flex h-7 items-center gap-1 rounded-lg border border-danger-edge bg-surface px-2.5 text-xs font-medium text-danger-retry"
          >
            <RotateCwIcon size={14} />
            ส่งใหม่
          </button>
        )}
        <span className={cn('font-medium', failed ? 'text-danger' : 'text-muted')}>
          {STATUS_LABEL[status]}
        </span>
        <span className="font-mono text-muted">{formatClock(message.sentAt)}</span>
      </span>

      {failed && message.error && (
        <span className="max-w-full pr-1 text-[11px] text-danger">{message.error}</span>
      )}
    </div>
  );
}

export function MessageBubble({ message, sender, onRetry }: MessageBubbleProps) {
  return message.direction === 'INBOUND' ? (
    <InboundBubble message={message} sender={sender} />
  ) : (
    <OutboundBubble message={message} onRetry={onRetry} />
  );
}
