import { z } from 'zod';

/** ความยาวข้อความตาม docs/implementation-plan.md §5 */
export const MAX_MESSAGE_LENGTH = 5000;

export const sendMessageSchema = z.object({
  text: z
    .string('พิมพ์ข้อความก่อนส่ง')
    .trim()
    .min(1, 'พิมพ์ข้อความก่อนส่ง')
    .max(MAX_MESSAGE_LENGTH, `ข้อความยาวเกิน ${MAX_MESSAGE_LENGTH} ตัวอักษร`),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
