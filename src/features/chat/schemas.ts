import { z } from 'zod';

/** ความยาวข้อความตาม docs/implementation-plan.md §5 */
export const MAX_MESSAGE_LENGTH = 5000;

export const sendMessageSchema = z.object({
  /**
   * client สร้างเอง (crypto.randomUUID) และใช้ id เดิมตอนกด "ส่งใหม่"
   * server ใช้เป็น idempotency key — ดู server/outbound.ts
   */
  id: z.uuid('รหัสข้อความไม่ถูกต้อง'),
  text: z
    .string('พิมพ์ข้อความก่อนส่ง')
    .trim()
    .min(1, 'พิมพ์ข้อความก่อนส่ง')
    .max(MAX_MESSAGE_LENGTH, `ข้อความยาวเกิน ${MAX_MESSAGE_LENGTH} ตัวอักษร`),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/** query ของ GET /messages — limit ไม่ส่ง = ใช้ค่าเริ่มต้นของ server (server/messages.ts) */
export const listMessagesQuerySchema = z.object({
  cursor: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
