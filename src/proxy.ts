import { NextResponse, type NextRequest } from 'next/server';
import { getAuthEnv } from '@/config/env.server';
import { ROUTES } from '@/shared/constants/routes';
import { SESSION_COOKIE, verifySessionToken } from '@/server/session';

function hasValidSession(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  try {
    return verifySessionToken(token, getAuthEnv().SESSION_SECRET);
  } catch {
    // env ไม่ครบ → ถือว่าไม่ผ่าน (fail closed)
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasValidSession(request);

  if (pathname === ROUTES.login) {
    return authed ? NextResponse.redirect(new URL(ROUTES.chat, request.url)) : NextResponse.next();
  }

  if (authed) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบก่อน' }, { status: 401 });
  }
  return NextResponse.redirect(new URL(ROUTES.login, request.url));
}

// /api/webhook ไม่อยู่ใน matcher — LINE ยิงเข้ามาได้ และยืนยันตัวตนด้วย x-line-signature แทน
export const config = {
  matcher: ['/login', '/chat/:path*', '/api/conversations/:path*'],
};
