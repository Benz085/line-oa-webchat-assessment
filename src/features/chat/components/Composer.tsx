'use client';

import { SendIcon } from '@/shared/components/ui/icons';
import { cn } from '@/shared/utils/cn';
import { MAX_MESSAGE_LENGTH } from '../schemas';
import { useChatStore } from '../stores/chat-store';

type ComposerProps = {
  userId: string;
  displayName: string;
  onSend: (text: string) => void;
};

export function Composer({ userId, displayName, onSend }: ComposerProps) {
  const draft = useChatStore((s) => s.drafts[userId]) ?? '';
  const setDraft = useChatStore((s) => s.setDraft);

  const isEmpty = draft.trim().length === 0;

  function submit() {
    if (!isEmpty) onSend(draft);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey) return;

    // กำลังประกอบคำด้วย IME (พิมพ์ไทย/จีน/ญี่ปุ่น) — Enter ตอนนี้คือยืนยันคำ ไม่ใช่ส่ง
    // keyCode 229 คือ fallback ของเบราว์เซอร์ที่ isComposing เป็น false ตอน keydown สุดท้าย
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;

    e.preventDefault();
    submit();
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-edge bg-surface px-3 pt-2.5 pb-5 md:px-6 md:pt-3.5 md:pb-[18px]">
      <label htmlFor="composer" className="sr-only">
        ข้อความถึง {displayName}
      </label>

      <div className="flex items-end gap-3 rounded-2xl border border-edge-input bg-raised py-2 pr-2 pl-4 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-ring">
        <textarea
          id="composer"
          rows={2}
          value={draft}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={`พิมพ์ข้อความถึง ${displayName}`}
          onChange={(e) => setDraft(userId, e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-normal outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isEmpty}
          aria-label="ส่งข้อความ"
          className={cn(
            'flex h-11 items-center gap-2 rounded-xl px-[18px] text-[15px] font-semibold text-white',
            isEmpty ? 'bg-accent-disabled' : 'bg-accent hover:bg-accent-hover',
          )}
        >
          <span className="hidden md:inline">ส่ง</span>
          <SendIcon size={18} />
        </button>
      </div>

      <div className="hidden justify-between text-xs text-muted md:flex">
        <span>Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่</span>
        <span className="font-mono">
          Push API · {draft.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
    </div>
  );
}
