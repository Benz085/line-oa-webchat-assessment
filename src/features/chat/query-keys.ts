export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (userId: string) => [...chatKeys.all, 'messages', userId] as const,
};
