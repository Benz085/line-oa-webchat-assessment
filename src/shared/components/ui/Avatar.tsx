import Image from 'next/image';
import { getAvatarColor } from '@/shared/utils/avatar-color';
import { getInitials } from '@/shared/utils/initials';

/** ขนาดตัวอักษรของอักษรย่อตามขนาด avatar ที่ดีไซน์ใช้ */
const FONT_SIZE: Record<number, number> = { 28: 12, 36: 14, 40: 15, 44: 16, 88: 32 };

type AvatarProps = {
  userId: string;
  displayName: string;
  pictureUrl?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ userId, displayName, pictureUrl, size = 44, className }: AvatarProps) {
  if (pictureUrl) {
    return (
      <Image
        src={pictureUrl}
        alt={displayName}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className ?? ''}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const { bg, ink } = getAvatarColor(userId);

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        background: bg,
        color: ink,
        fontSize: FONT_SIZE[size] ?? Math.round(size * 0.36),
      }}
    >
      {getInitials(displayName)}
    </span>
  );
}
