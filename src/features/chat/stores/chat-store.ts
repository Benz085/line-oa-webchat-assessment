'use client';

import { create } from 'zustand';

type ChatState = {
  selectedUserId: string | null;
  drafts: Record<string, string>;
  selectUser: (userId: string | null) => void;
  setDraft: (userId: string, text: string) => void;
  clearDraft: (userId: string) => void;
};

export const useChatStore = create<ChatState>()((set) => ({
  selectedUserId: null,
  drafts: {},
  selectUser: (userId) => set({ selectedUserId: userId }),
  setDraft: (userId, text) => set((s) => ({ drafts: { ...s.drafts, [userId]: text } })),
  clearDraft: (userId) =>
    set((s) => ({
      drafts: Object.fromEntries(Object.entries(s.drafts).filter(([id]) => id !== userId)),
    })),
}));
