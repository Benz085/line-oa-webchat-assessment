export type AvatarColor = { bg: string; ink: string };

/** คู่สี avatar 6 ชุดจาก Design canvas */
const AVATAR_COLORS: readonly AvatarColor[] = [
  { bg: '#F3DFC9', ink: '#6B3A12' },
  { bg: '#DCE8F3', ink: '#1F4A70' },
  { bg: '#E4DDF2', ink: '#46307A' },
  { bg: '#F4DCE4', ink: '#7A2745' },
  { bg: '#DDEEE0', ink: '#1F5A33' },
  { bg: '#ECE7DA', ink: '#5A4B22' },
];

const FALLBACK: AvatarColor = { bg: '#ECE7DA', ink: '#5A4B22' };

/**
 * เลือกสีจาก userId แบบ deterministic — ผู้ใช้คนเดิมได้สีเดิมเสมอ
 * ทั้งฝั่ง server และ client จึงไม่เกิด hydration mismatch
 */
export function getAvatarColor(userId: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 2147483647;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? FALLBACK;
}
