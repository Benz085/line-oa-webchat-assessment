import { clientEnv } from '@/config/env.client';
import { OaInvite } from '@/shared/components/ui/OaInvite';

export default function ChatIndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="font-display text-2xl font-bold">เลือกห้องแชทเพื่อเริ่มตอบ</h2>
          <p className="text-muted">
            เลือกผู้ใช้จากรายชื่อด้านซ้าย หรือแอด OA แล้วทักมาเพื่อสร้างห้องแชทใหม่
          </p>
        </div>
        <OaInvite href={clientEnv.NEXT_PUBLIC_LINE_OA_URL} />
      </div>
    </div>
  );
}
