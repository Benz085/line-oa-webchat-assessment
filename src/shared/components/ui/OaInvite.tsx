import { create } from 'qrcode';
import { cn } from '@/shared/utils/cn';

type OaInviteProps = {
  /** ลิงก์แอดเพื่อน LINE OA — ยังไม่ตั้งค่าจะแสดงเป็น placeholder */
  href?: string;
  className?: string;
};

/** quiet zone รอบ QR ตามสเปก (ขั้นต่ำ 4 module แต่ 2 ก็สแกนติดบนจอ และทำให้ QR ใหญ่ขึ้นในกรอบเดิม) */
const QUIET_ZONE = 2;

/**
 * QR ของลิงก์แอดเพื่อน สร้างฝั่ง server เป็น SVG path — ไม่ต้องมีรูปไฟล์และไม่ใช้ innerHTML
 * สีตายตัวดำบนขาว (ไม่ตาม token) เพราะ QR ต้องคอนทราสต์สูงสุดเสมอ
 */
function QrCode({ value }: { value: string }) {
  const { size, data } = create(value, { errorCorrectionLevel: 'M' }).modules;

  let path = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y * size + x]) path += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
    }
  }

  const box = size + QUIET_ZONE * 2;
  return (
    <svg
      role="img"
      aria-label="QR code สำหรับแอด LINE OA"
      viewBox={`0 0 ${box} ${box}`}
      shapeRendering="crispEdges"
      className="size-24 shrink-0 rounded-xl border border-edge bg-white"
    >
      <path d={path} fill="#000" />
    </svg>
  );
}

/** QR + ลิงก์แอด LINE OA ใช้ทั้งหน้า login และ empty state ของห้องแชท */
export function OaInvite({ href, className }: OaInviteProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {href ? (
        <QrCode value={href} />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-edge-dashed text-center text-[11px] text-muted"
        >
          [QR CODE]
        </div>
      )}
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
