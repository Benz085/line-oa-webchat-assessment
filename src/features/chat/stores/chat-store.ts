'use client';

import { create } from 'zustand';
import type { Message } from '../types';

/**
 * ข้อความที่ยังไม่ถึง server — กำลังส่ง (PENDING) หรือส่งไม่สำเร็จ (FAILED)
 *
 * เก็บแยกจาก query cache เพราะ polling จะ overwrite cache ทุก 2 วินาที
 * ข้อความ FAILED ที่ server ไม่รู้จักจะหายไปก่อนที่ผู้ใช้จะกดส่งใหม่ทัน
 * ตอน render จึงเอา outbox มาต่อท้ายข้อความจาก server
 */
type ChatState = {
  drafts: Record<string, string>;
  outbox: Record<string, Message[]>;
  isProfileOpen: boolean;

  setDraft: (userId: string, text: string) => void;
  clearDraft: (userId: string) => void;
  addToOutbox: (userId: string, message: Message) => void;
  updateInOutbox: (userId: string, messageId: string, patch: Partial<Message>) => void;
  removeFromOutbox: (userId: string, messageId: string) => void;
  toggleProfile: () => void;
};

export const useChatStore = create<ChatState>()((set) => ({
  drafts: {},
  outbox: {},
  isProfileOpen: true,

  setDraft: (userId, text) => set((s) => ({ drafts: { ...s.drafts, [userId]: text } })),

  clearDraft: (userId) =>
    set((s) => ({
      drafts: Object.fromEntries(Object.entries(s.drafts).filter(([id]) => id !== userId)),
    })),

  addToOutbox: (userId, message) =>
    set((s) => ({ outbox: { ...s.outbox, [userId]: [...(s.outbox[userId] ?? []), message] } })),

  updateInOutbox: (userId, messageId, patch) =>
    set((s) => ({
      outbox: {
        ...s.outbox,
        [userId]: (s.outbox[userId] ?? []).map((m) =>
          m.id === messageId ? { ...m, ...patch } : m,
        ),
      },
    })),

  removeFromOutbox: (userId, messageId) =>
    set((s) => ({
      outbox: { ...s.outbox, [userId]: (s.outbox[userId] ?? []).filter((m) => m.id !== messageId) },
    })),

  toggleProfile: () => set((s) => ({ isProfileOpen: !s.isProfileOpen })),
}));
