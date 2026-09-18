export const ROUTES = {
  home: '/',
  login: '/login',
  chat: '/chat',
  chatRoom: (userId: string) => `/chat/${userId}`,
} as const;
