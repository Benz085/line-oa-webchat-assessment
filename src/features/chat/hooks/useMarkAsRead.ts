import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAsRead } from '../api';
import { chatKeys } from '../query-keys';

/**
 * เคลียร์ unread ของห้องที่เปิดอยู่
 * ผูกกับ unreadCount ด้วย — ถ้ามีข้อความใหม่เข้ามาตอนเปิดห้องค้างไว้ก็จะถูกอ่านต่อเนื่อง
 */
export function useMarkAsRead(userId: string, unreadCount: number) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: () => markAsRead(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
  });

  useEffect(() => {
    if (unreadCount > 0) mutate();
  }, [userId, unreadCount, mutate]);
}
