'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/shared/components/ui/Avatar';
import { CopyIcon } from '@/shared/components/ui/icons';
import type { Conversation } from '../types';
import { formatFullDate } from '../utils/format-time';

type ProfilePanelProps = {
  conversation: Conversation;
  messageCount: number;
};

const COPIED_MS = 1500;

export function ProfilePanel({ conversation, messageCount }: ProfilePanelProps) {
  const { userId, displayName, pictureUrl, statusMessage, isFollowing, createdAt } = conversation;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copyUserId() {
    try {
      await navigator.clipboard.writeText(userId);
    } catch {
      // clipboard ถูกบล็อก (เช่น http ที่ไม่ใช่ localhost) — ไม่แสดง "คัดลอกแล้ว" หลอก
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <aside
      aria-label="โปรไฟล์ผู้ใช้"
      className="hidden w-[300px] shrink-0 flex-col gap-7 border-l border-edge bg-surface px-6 py-8 xl:flex"
    >
      <div className="flex flex-col items-center gap-2.5 text-center">
        <Avatar userId={userId} displayName={displayName} pictureUrl={pictureUrl} size={88} />
        <h3 className="mt-1 text-[19px] font-semibold">{displayName}</h3>
        <p className="text-[13px] text-muted italic">{statusMessage || 'ไม่มีข้อความสถานะ'}</p>
      </div>

      <dl className="flex flex-col gap-4 text-[13px]">
        <div className="flex flex-col gap-1">
          <dt className="text-muted">LINE userId</dt>
          <dd className="flex items-center gap-2">
            <span
              title={userId}
              className="flex-1 truncate rounded-md bg-paper px-2 py-1 font-mono text-xs"
            >
              {userId}
            </span>
            <button
              type="button"
              onClick={copyUserId}
              aria-label="คัดลอก userId"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface"
            >
              <CopyIcon size={16} />
            </button>
          </dd>
          <span role="status" className="h-4 text-xs text-accent">
            {copied ? 'คัดลอกแล้ว' : ''}
          </span>
        </div>

        <div className="flex justify-between gap-3">
          <dt className="text-muted">สถานะ</dt>
          <dd className="font-medium">{isFollowing ? 'กำลังติดตาม OA' : 'เลิกติดตามแล้ว'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">เพิ่มเพื่อนเมื่อ</dt>
          <dd className="font-medium">{formatFullDate(createdAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">ข้อความในห้องนี้</dt>
          <dd className="font-mono font-medium">{messageCount}</dd>
        </div>
      </dl>

      <div className="flex-1" />
      <p className="text-xs leading-normal text-muted">
        ชื่อและรูปโปรไฟล์ดึงจาก LINE Get Profile API ตอนผู้ใช้เพิ่มเพื่อนหรือส่งข้อความครั้งแรก
      </p>
    </aside>
  );
}
