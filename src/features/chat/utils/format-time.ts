const TIME_ZONE = 'Asia/Bangkok';

// en-GB ให้ `10:32` เสมอ — th-TH บาง ICU version คั่นด้วยจุด (`10.32`)
const clockFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const weekdayFmt = new Intl.DateTimeFormat('th-TH', { timeZone: TIME_ZONE, weekday: 'short' });

const dayMonthFmt = new Intl.DateTimeFormat('th-TH', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
});

// ปฏิทินสากล — th-TH ปกติให้ปี พ.ศ. แต่ดีไซน์ใช้ ค.ศ. (`12 ก.ย. 2026`)
const fullDateFmt = new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** yyyy-MM-dd ตามเวลาไทย ใช้เทียบว่าคนละวันกันกี่วัน */
const isoDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function daysBetween(iso: string, now: Date): number {
  const then = Date.parse(isoDateFmt.format(new Date(iso)));
  const today = Date.parse(isoDateFmt.format(now));
  return Math.round((today - then) / 86_400_000);
}

/** เวลาในฟองข้อความ เช่น `10:32` */
export function formatClock(iso: string): string {
  return clockFmt.format(new Date(iso));
}

/**
 * ป้ายเวลาในรายชื่อแชท ตามที่ดีไซน์กำหนด
 * วันนี้ → `10:32` · เมื่อวาน → `เมื่อวาน` · ในสัปดาห์ → `จ.` · เก่ากว่านั้น → `14 ก.ย.`
 *
 * ขึ้นกับ "วันนี้" จึงต้องเรียกจากฝั่ง client เท่านั้น ไม่งั้นอาจ hydration mismatch
 */
export function formatConversationTime(iso: string | null, now = new Date()): string {
  if (!iso) return '';

  const diff = daysBetween(iso, now);
  const date = new Date(iso);

  if (diff <= 0) return clockFmt.format(date);
  if (diff === 1) return 'เมื่อวาน';
  if (diff < 7) return weekdayFmt.format(date);
  return dayMonthFmt.format(date);
}

/** ป้ายคั่นวันเหนือกลุ่มข้อความ */
export function formatDayDivider(iso: string, now = new Date()): string {
  const diff = daysBetween(iso, now);
  if (diff <= 0) return 'วันนี้';
  if (diff === 1) return 'เมื่อวาน';
  return dayMonthFmt.format(new Date(iso));
}

/** คีย์ของวัน ใช้จัดกลุ่มข้อความก่อนแทรกป้ายคั่นวัน */
export function dayKey(iso: string): string {
  return isoDateFmt.format(new Date(iso));
}

/** วันที่แบบเต็ม เช่น `12 ก.ย. 2026` */
export function formatFullDate(iso: string): string {
  return fullDateFmt.format(new Date(iso));
}
