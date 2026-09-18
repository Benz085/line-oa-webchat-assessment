import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage } from '../api';
import { chatKeys } from '../query-keys';
import { useChatStore } from '../stores/chat-store';
import type { Message } from '../types';

type SendVars = { userId: string; text: string; localId: string };

/**
 * ส่งข้อความแบบ optimistic: ใส่ bubble สถานะ PENDING ทันที
 * สำเร็จ → รอให้ข้อความจริงเข้า cache ก่อนค่อยเอาออกจาก outbox (ไม่งั้น bubble กระพริบหาย)
 * ล้มเหลว → เปลี่ยนเป็น FAILED พร้อมข้อความ error และให้กด "ส่งใหม่" ได้
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { addToOutbox, updateInOutbox, removeFromOutbox, clearDraft } = useChatStore.getState();

  const mutation = useMutation({
    mutationFn: ({ userId, text }: SendVars) => sendMessage(userId, text),

    onSuccess: async (_message, { userId, localId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(userId) }),
        queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
      ]);
      removeFromOutbox(userId, localId);
    },

    onError: (error, { userId, localId }) => {
      updateInOutbox(userId, localId, { status: 'FAILED', error: error.message });
    },
  });

  function send(userId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pending: Message = {
      id: localId,
      lineUserId: userId,
      direction: 'OUTBOUND',
      type: 'text',
      text: trimmed,
      status: 'PENDING',
      error: null,
      sentAt: new Date().toISOString(),
    };

    addToOutbox(userId, pending);
    clearDraft(userId);
    mutation.mutate({ userId, text: trimmed, localId });
  }

  function retry(message: Message) {
    if (!message.text) return;
    updateInOutbox(message.lineUserId, message.id, { status: 'PENDING', error: null });
    mutation.mutate({ userId: message.lineUserId, text: message.text, localId: message.id });
  }

  return { send, retry };
}
