import 'server-only';
import { cookies } from 'next/headers';
import { getAuthEnv } from '@/config/env.server';
import { SESSION_COOKIE, verifySessionToken } from './session';

/**
 * ใช้ใน route handler เป็นด่านที่สอง — proxy.ts กันไว้แล้วชั้นหนึ่ง
 * แต่ proxy ไม่ควรเป็นตัวตัดสินสิทธิ์เพียงอย่างเดียว (Next docs)
 * env ไม่ครบถือว่าไม่ผ่าน (fail closed)
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;

  try {
    return verifySessionToken(token, getAuthEnv().SESSION_SECRET);
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json({ error: 'ต้องเข้าสู่ระบบก่อน' }, { status: 401 });
}
