import { ChatRoom } from '@/features/chat/components/ChatRoom';

export default async function ChatRoomPage({ params }: PageProps<'/chat/[userId]'>) {
  const { userId } = await params;

  return <ChatRoom userId={userId} />;
}
