export type Direction = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED';
export type MessageType = 'text' | 'sticker' | 'image' | 'unsupported';

/**
 * ชื่อ field ตรงกับ Prisma models ใน docs/implementation-plan.md §4
 * เพื่อให้ตอนสลับจาก mock ไป Prisma ฝั่ง UI ไม่ต้องแก้
 *
 * lastMessage / lastMessageDirection เป็น denormalized cache สำหรับ sidebar
 * (lastMessageDirection เป็นคอลัมน์ที่ต้องเพิ่มใน schema จริง ใช้ทำ prefix "คุณ: ")
 */
export type Conversation = {
  userId: string;
  displayName: string;
  pictureUrl: string | null;
  statusMessage: string | null;
  isFollowing: boolean;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageDirection: Direction | null;
  lastMessageAt: string | null;
  createdAt: string;
};

export type Message = {
  id: string;
  lineUserId: string;
  direction: Direction;
  type: MessageType;
  text: string | null;
  status: MessageStatus;
  error: string | null;
  sentAt: string;
};
