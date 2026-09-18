import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sign(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payload).digest();
}

/** token = `<หมดอายุ (ms)>.<HMAC-SHA256 hex>` — ไม่มีข้อมูลผู้ใช้ เพราะมีผู้ดูแลรหัสเดียว */
export function createSessionToken(secret: string, now = Date.now()): string {
  const expires = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expires}.${sign(expires, secret).toString('hex')}`;
}

export function verifySessionToken(token: string, secret: string, now = Date.now()): boolean {
  const [expires, signature, ...rest] = token.split('.');
  if (!expires || !signature || rest.length > 0) return false;
  if (!/^\d+$/.test(expires) || Number(expires) <= now) return false;

  const given = Buffer.from(signature, 'hex');
  const expected = sign(expires, secret);
  // timingSafeEqual ต้องยาวเท่ากัน ไม่งั้น throw
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** เทียบรหัสผ่านแบบ constant-time — hash ก่อนเพื่อให้ความยาวเท่ากันเสมอ */
export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
