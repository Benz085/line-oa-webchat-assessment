'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ROUTES } from '@/shared/constants/routes';

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        if (!res.ok) {
          const body: { error?: string } | null = await res.json().catch(() => null);
          setError(body?.error ?? 'เข้าสู่ระบบไม่สำเร็จ');
          return;
        }

        router.replace(ROUTES.chat);
        router.refresh();
      } catch {
        setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง');
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <label htmlFor="admin-password" className="text-sm font-medium">
          รหัสผ่านผู้ดูแล
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
          className="h-12 rounded-xl border border-edge-input bg-surface px-3.5 text-[15px] outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-ring"
        />
        {error && (
          <span id="login-error" role="alert" className="text-xs text-danger">
            {error}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !password}
        className="flex h-12 items-center justify-center rounded-xl bg-accent text-base font-semibold text-white hover:bg-accent-hover disabled:bg-accent-disabled"
      >
        {isPending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  );
}
