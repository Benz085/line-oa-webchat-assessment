import Link from 'next/link';
import { MessageCircleIcon } from '@/shared/components/ui/icons';
import { ROUTES } from '@/shared/constants/routes';

type NavRailProps = {
  /** ปุ่มท้ายแถบ (ออกจากระบบ) — ส่งเข้ามาจาก layout เพื่อไม่ให้ feature นี้พึ่ง feature auth */
  footer?: React.ReactNode;
};

export function NavRail({ footer }: NavRailProps) {
  return (
    <nav
      aria-label="เมนูหลัก"
      className="flex h-full w-[72px] shrink-0 flex-col items-center gap-2 bg-ink px-0 py-5"
    >
      <div
        aria-hidden="true"
        className="mb-5 flex size-10 items-center justify-center rounded-xl bg-accent font-display text-lg font-bold text-white"
      >
        W
      </div>

      <Link
        href={ROUTES.chat}
        aria-label="แชท"
        aria-current="page"
        className="flex size-11 items-center justify-center rounded-xl bg-rail-active text-white"
      >
        <MessageCircleIcon />
      </Link>

      <div className="flex-1" />
      {footer}
    </nav>
  );
}
