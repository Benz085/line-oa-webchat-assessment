import { cn } from '@/shared/utils/cn';

type OaInviteProps = {
  /** ลิงก์แอดเพื่อน LINE OA — ยังไม่ตั้งค่าจะแสดงเป็น placeholder */
  href?: string;
  className?: string;
};

/**
 * กรอบ QR + ลิงก์แอด LINE OA ใช้ทั้งหน้า login และ empty state ของห้องแชท
 * QR จริงจะใส่ตอนได้ LINE OA แล้ว ตอนนี้เป็นกรอบเส้นประตามดีไซน์
 */
export function OaInvite({ href, className }: OaInviteProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div
        aria-hidden="true"
        className="flex size-[88px] shrink-0 items-center justify-center rounded-xl border border-dashed border-edge-dashed text-center text-[11px] text-muted"
      >
        [QR CODE]
      </div>
      <div className="flex min-w-0 flex-col gap-1 text-sm">
        <span className="font-medium">ทดสอบด้วยการแอด LINE OA</span>
        <span className="text-muted">สแกน QR แล้วทักมา ข้อความจะขึ้นในหน้าแชท</span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="truncate font-mono text-[13px] text-accent hover:text-accent-hover"
          >
            {href}
          </a>
        ) : (
          <span className="font-mono text-[13px] text-muted">[LINE OA URL]</span>
        )}
      </div>
    </div>
  );
}
