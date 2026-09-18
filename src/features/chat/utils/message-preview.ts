import type { Conversation } from '@/features/chat/types';

/**
 * ข้อความล่าสุดที่แสดงในรายชื่อแชท
 * ถ้าเป็นข้อความที่เราส่งเองจะเติม "คุณ: " นำหน้าตามดีไซน์
 */
export function formatPreview(conversation: Conversation): string {
  const { lastMessage, lastMessageDirection } = conversation;
  if (!lastMessage) return 'ยังไม่มีข้อความ';
  return lastMessageDirection === 'OUTBOUND' ? `คุณ: ${lastMessage}` : lastMessage;
}

/** ข้อความในฟองแชท — ชนิดที่ยังไม่รองรับแสดงเป็นป้ายกำกับแทน */
export function formatBody(type: string, text: string | null): string {
  if (text) return text;
  if (type === 'sticker') return '[สติกเกอร์]';
  if (type === 'image') return '[รูปภาพ]';
  return '[ข้อความชนิดนี้ยังไม่รองรับการแสดงผล]';
}
