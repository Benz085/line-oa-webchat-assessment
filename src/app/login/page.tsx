import { clientEnv } from '@/config/env.client';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { OaInvite } from '@/shared/components/ui/OaInvite';

const HIGHLIGHTS = [
  'รับข้อความจากผู้ใช้ผ่าน Webhook',
  'เห็นชื่อและรูปโปรไฟล์ของผู้ที่ทักเข้ามา',
  'เลือกผู้ใช้แล้วตอบกลับด้วย Push API',
];

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-1">
      <section className="hidden w-[620px] shrink-0 flex-col gap-10 bg-ink p-16 text-paper lg:flex">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-xl bg-accent font-display text-lg font-bold text-white"
          >
            W
          </span>
          <span className="font-display text-xl font-bold tracking-[-0.01em]">LINE OA Webchat</span>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-9">
          <h1 className="text-[44px] leading-[1.3] font-semibold">
            ตอบแชทลูกค้าจาก LINE OA ได้จากหน้าเว็บเดียว
          </h1>
          <ol className="flex flex-col gap-[18px] text-base text-rail-text">
            {HIGHLIGHTS.map((text, index) => (
              <li key={text} className="flex items-center gap-3.5">
                <span className="font-mono text-[13px] text-accent-soft">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </div>

        <span className="font-mono text-xs text-rail-dim">
          Next.js · Vercel · LINE Messaging API
        </span>
      </section>

      <main className="flex flex-1 items-center justify-center p-6 md:p-16">
        <div className="flex w-full max-w-[400px] flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-[32px] font-bold tracking-[-0.01em]">เข้าสู่ระบบ</h2>
            <p className="text-[15px] text-muted">สำหรับผู้ดูแล LINE OA เท่านั้น</p>
          </div>

          <LoginForm />

          <div className="h-px bg-edge" />
          <OaInvite href={clientEnv.NEXT_PUBLIC_LINE_OA_URL} />
        </div>
      </main>
    </div>
  );
}
