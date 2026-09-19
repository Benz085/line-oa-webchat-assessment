import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'prisma/config';

// Prisma CLI ไม่อ่าน .env.local เอง — ใช้ loader เดียวกับ Next เพื่อให้ค่าตรงกับตอน `next dev`
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // migrate ต้องใช้ direct connection (pooler ของ Neon ทำ advisory lock ของ migrate ไม่ได้)
    // ไม่ throw ถ้าไม่มีค่า เพื่อให้ `prisma generate` รันได้บน CI/เครื่องที่ยังไม่มี DB
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  },
});
