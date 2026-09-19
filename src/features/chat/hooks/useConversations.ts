import { useQuery } from '@tanstack/react-query';
import { fetchConversations } from '../api';
import { chatKeys } from '../query-keys';

/** poll ทุก 3 วินาที ตาม docs/implementation-plan.md §6 */
export const CONVERSATIONS_POLL_MS = 3000;

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: fetchConversations,
    refetchInterval: CONVERSATIONS_POLL_MS,
    // หยุด poll ตอนสลับไปแท็บอื่น (§13 ความเสี่ยงเรื่อง request เยอะ)
    refetchIntervalInBackground: false,
  });
}
