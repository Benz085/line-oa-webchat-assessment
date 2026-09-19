'use client';

import { create } from 'zustand';
import type { Message } from '../types';

/**
 * ข้อความที่ผู้ใช้เพิ่งกดส่ง/ส่งใหม่และ server ยังไม่ตอบ (PENDING) หรือคำขอไม่ถึง server (FAILED)
 *
 * ข้อความที่ LINE ปฏิเสธ (FAILED) ถูกบันทึกใน DB แล้ว จึงมาจาก server ไม่ต้องอยู่ที่นี่
 * outbox มีไว้ให้ bubble ขึ้นทันทีโดยไม่ต้องรอ round trip และไม่ถูก polling ทับ
 * ตอน render รวมกับข้อความจาก server ด้วย id (ดู utils/merge-thread.ts)
 */
type ChatState = {
  drafts: Record<string, string>;
  outbox: Record<string, Message[]>;
  isProfileOpen: boolean;

  setDraft: (userId: string, text: string) => void;
  clearDraft: (userId: string) => void;
  /** id ซ้ำ = แทนที่ (ใช้ตอนกด "ส่งใหม่" ที่ใช้ id เดิม) */
  putInOutbox: (userId: string, message: Message) => void;
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

  putInOutbox: (userId, message) =>
    set((s) => ({
      outbox: {
        ...s.outbox,
        [userId]: [...(s.outbox[userId] ?? []).filter((m) => m.id !== message.id), message],
      },
    })),

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
