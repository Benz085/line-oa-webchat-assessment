import 'server-only';
import { z } from 'zod';

/**
 * แยก parse เป็นเรื่อง ๆ แทนที่จะรวดเดียวทั้งก้อน เพื่อให้เฟสที่ยังใช้ mock data
 * เรียก getAuthEnv() ได้โดยไม่ต้องมี DATABASE_URL หรือ LINE credentials ในเครื่อง
 */
function lazy<T extends z.ZodType>(schema: T) {
  let cached: z.infer<T> | undefined;
  return () => (cached ??= schema.parse(process.env));
}

export const getAuthEnv = lazy(
  z.object({
    ADMIN_PASSWORD: z.string().min(1),
    SESSION_SECRET: z.string().min(32),
  }),
);

export const getLineEnv = lazy(
  z.object({
    LINE_CHANNEL_SECRET: z.string().min(1),
    LINE_CHANNEL_ACCESS_TOKEN: z.string().min(1),
  }),
);

// DIRECT_URL ไม่อยู่ที่นี่: มีแค่ prisma.config.ts ที่อ่าน (ตอน migrate) แอปตอน runtime ใช้ DATABASE_URL อย่างเดียว
export const getDbEnv = lazy(
  z.object({
    DATABASE_URL: z.string().min(1),
  }),
);
