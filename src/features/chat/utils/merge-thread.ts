import type { Message, MessagesResponse } from '../types';

function byTime(a: Message, b: Message): number {
  if (a.sentAt !== b.sentAt) return a.sentAt < b.sentAt ? -1 : 1;
  return a.id < b.id ? -1 : 1;
}

/**
 * ข้อความของห้อง = ทุกหน้าที่โหลดมาจาก server + ข้อความใน outbox
 *
 * - server เป็นแหล่งความจริง: id ซ้ำกัน server ชนะ (จึงไม่มี bubble ซ้ำตอนแถวจริงมาถึง)
 * - ข้อยกเว้น: outbox ที่ยัง PENDING คือสิ่งที่ผู้ใช้เพิ่งกดส่ง/ส่งใหม่ จึงทับแถวเดิมจาก server
 *   (เช่น ข้อความ FAILED ที่เพิ่งกด "ส่งใหม่" ต้องขึ้น "กำลังส่ง…" ทันที ไม่ต้องรอ round trip)
 * - outbox ที่ FAILED และ server ไม่รู้จัก = คำขอไม่ถึง server เลย (เช่น เน็ตหลุด) จึงแสดงจาก outbox
 */
export function mergeThread(pages: MessagesResponse[] | undefined, outbox: Message[]): Message[] {
  const byId = new Map<string, Message>();

  for (const page of pages ?? []) {
    for (const message of page.messages) byId.set(message.id, message);
  }
  for (const message of outbox) {
    if (message.status === 'PENDING' || !byId.has(message.id)) byId.set(message.id, message);
  }

  return [...byId.values()].sort(byTime);
}
