import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { ChatRoom } from '@/features/chat/components/ChatRoom';

const mobileLogout = 'flex size-11 items-center justify-center rounded-xl text-muted';

export default async function ChatRoomPage({ params }: PageProps<'/chat/[userId]'>) {
  const { userId } = await params;

  return <ChatRoom userId={userId} headerAction={<LogoutButton className={mobileLogout} />} />;
}
