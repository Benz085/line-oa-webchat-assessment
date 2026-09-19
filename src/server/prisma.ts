import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { getDbEnv } from '@/config/env.server';

// เก็บไว้บน globalThis กัน HMR ของ `next dev` สร้าง connection pool ใหม่ทุกครั้งที่ reload
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * สร้างตอนเรียกครั้งแรก ไม่ใช่ตอน import — ให้ route ที่ยังใช้ mock data
 * ไม่ต้องมี DATABASE_URL (สอดคล้องกับ getDbEnv ที่เป็น lazy)
 */
export function getPrisma() {
  // runtime ใช้ pooled URL (DATABASE_URL) เสมอ — DIRECT_URL ไว้ให้ migrate เท่านั้น
  return (globalForPrisma.prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDbEnv().DATABASE_URL }),
  }));
}
