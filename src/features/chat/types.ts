export type Direction = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'PENDING' | 'SENT' | 'FAILED';
export type MessageType = 'text' | 'sticker' | 'image' | 'unsupported';

/**
 * ชื่อ field ตรงกับ Prisma models ใน docs/implementation-plan.md §4
 *
 * lastMessage / lastMessageDirection เป็น denormalized cache สำหรับ sidebar
 * (lastMessageDirection ใช้ทำ prefix "คุณ: ")
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

/**
 * ผลของ GET /api/conversations/[userId]/messages
 *
 * conversation และ messageCount มีเฉพาะหน้าแรก (ไม่ส่ง cursor) — หน้าที่เก่ากว่าเป็น null
 * เพื่อไม่ต้อง query ซ้ำทุกครั้งที่กด "โหลดข้อความเก่ากว่า"
 */
export type MessagesResponse = {
  /** เรียงเก่า → ใหม่ */
  messages: Message[];
  /** ส่งกลับเป็น `cursor` เพื่อขอหน้าที่เก่ากว่า — null = ไม่มีแล้ว */
  nextCursor: string | null;
  conversation: Conversation | null;
  messageCount: number | null;
};
