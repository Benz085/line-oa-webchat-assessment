const LATIN = /^[A-Za-z]/;

/**
 * ชื่อไทยเอาอักษรแรกตัวเดียว (`สมชาย ใจดี` → `ส`)
 * ชื่อ latin เอาอักษรแรกของสองคำแรก (`Suda P.` → `SP`) ตามที่ดีไซน์ทำไว้
 */
export function getInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return '?';

  if (!LATIN.test(first)) return [...first][0] ?? '?';

  const second = words[1];
  const head = first[0] ?? '';
  const tail = second?.[0] ?? '';
  return (head + tail).toUpperCase();
}
