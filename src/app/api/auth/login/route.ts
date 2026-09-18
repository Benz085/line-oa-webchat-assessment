import { cookies } from 'next/headers';
import { z } from 'zod';
import { getAuthEnv } from '@/config/env.server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  passwordMatches,
} from '@/server/session';

const loginSchema = z.object({
  password: z.string('กรอกรหัสผ่านก่อน').min(1, 'กรอกรหัสผ่านก่อน'),
});

/** หน่วงตอนรหัสผิดเพื่อชะลอการเดาสุ่ม */
const WRONG_PASSWORD_DELAY_MS = 500;

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' },
      { status: 400 },
    );
  }

  let env: ReturnType<typeof getAuthEnv>;
  try {
    env = getAuthEnv();
  } catch {
    return Response.json(
      { error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า ADMIN_PASSWORD และ SESSION_SECRET' },
      { status: 500 },
    );
  }

  if (!passwordMatches(parsed.data.password, env.ADMIN_PASSWORD)) {
    await new Promise((resolve) => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));
    return Response.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(env.SESSION_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return Response.json({ ok: true });
}
