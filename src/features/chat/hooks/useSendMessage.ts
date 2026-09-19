import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage } from '../api';
import { chatKeys } from '../query-keys';
import { useChatStore } from '../stores/chat-store';
import type { Message } from '../types';

type SendVars = { userId: string; id: string; text: string };

/**
 * ส่งข้อความแบบ optimistic: ใส่ bubble สถานะ PENDING ทันที แล้วให้ server ตัดสินสถานะจริง
 *
 * สำเร็จ (รวมกรณี LINE ปฏิเสธ → ได้ FAILED กลับมา) → รอให้แถวจริงเข้า cache ก่อนค่อยเอาออกจาก outbox
 *   ไม่งั้น bubble กระพริบหาย
 * คำขอไม่ถึง server → outbox เปลี่ยนเป็น FAILED พร้อม error; server อาจสร้างแถวไปแล้ว
 *   (เช่น timeout) จึง invalidate ด้วย ถ้ามีแถวจริงมันจะชนะ outbox ตอน merge
 *
 * "ส่งใหม่" = ส่ง id เดิมซ้ำ → server ทับแถวเดิม ไม่สร้างข้อความใหม่ และกันส่งซ้ำด้วย retry key
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { putInOutbox, updateInOutbox, removeFromOutbox, clearDraft } = useChatStore.getState();

  const refresh = (userId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(userId) }),
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
    ]);

  const mutation = useMutation({
    mutationFn: ({ userId, id, text }: SendVars) => sendMessage(userId, id, text),

    onSuccess: async (_message, { userId, id }) => {
      await refresh(userId);
      removeFromOutbox(userId, id);
    },

    onError: (error, { userId, id }) => {
      updateInOutbox(userId, id, { status: 'FAILED', error: error.message });
      void refresh(userId);
    },
  });

  function submit(userId: string, id: string, text: string, base?: Message) {
    putInOutbox(userId, {
      id,
      lineUserId: userId,
      direction: 'OUTBOUND',
      type: 'text',
      ...base,
      text,
      status: 'PENDING',
      error: null,
      // เวลาที่ส่งจริง — server ก็ขยับ sentAt เป็นตอนนี้ตอนส่งใหม่ ลำดับจะได้ตรงกัน
      sentAt: new Date().toISOString(),
    });
    mutation.mutate({ userId, id, text });
  }

  function send(userId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    clearDraft(userId);
    submit(userId, crypto.randomUUID(), trimmed);
  }

  function retry(message: Message) {
    if (!message.text) return;
    submit(message.lineUserId, message.id, message.text, message);
  }

  return { send, retry };
}
