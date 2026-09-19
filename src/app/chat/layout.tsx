import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { ChatShell } from '@/features/chat/components/ChatShell';
import { NavRail } from '@/features/chat/components/NavRail';

const railLogout =
  'flex size-11 items-center justify-center rounded-xl text-rail-icon hover:bg-rail-active hover:text-white';
const mobileLogout = 'flex size-11 items-center justify-center rounded-xl text-muted';

export default function ChatLayout({ children }: LayoutProps<'/chat'>) {
  return (
    <ChatShell
      rail={<NavRail footer={<LogoutButton className={railLogout} />} />}
      mobileAction={<LogoutButton className={mobileLogout} />}
    >
      {children}
    </ChatShell>
  );
}
