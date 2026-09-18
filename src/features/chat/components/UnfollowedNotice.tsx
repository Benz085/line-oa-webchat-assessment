import { AlertCircleIcon } from '@/shared/components/ui/icons';

export function UnfollowedNotice() {
  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-2.5 border-t border-warn-edge bg-warn-bg px-6 py-[18px] text-sm text-warn-ink"
    >
      <AlertCircleIcon className="shrink-0" />
      ผู้ใช้นี้เลิกติดตาม OA แล้ว จึงส่งข้อความหาไม่ได้จนกว่าจะเพิ่มเพื่อนอีกครั้ง
    </div>
  );
}
