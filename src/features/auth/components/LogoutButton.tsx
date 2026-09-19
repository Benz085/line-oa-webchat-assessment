'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { ROUTES } from '@/shared/constants/routes';
import { LogOutIcon } from '@/shared/components/ui/icons';

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace(ROUTES.login);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isPending}
      aria-label="ออกจากระบบ"
      title="ออกจากระบบ"
      className={className}
    >
      <LogOutIcon />
    </button>
  );
}
