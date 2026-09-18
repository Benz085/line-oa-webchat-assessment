import 'server-only';
import { z } from 'zod';

const serverSchema = z.object({
  LINE_CHANNEL_SECRET: z.string().min(1),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});

let cached: z.infer<typeof serverSchema> | undefined;

// Lazy so `next build` does not fail before env is provided; call only from server code
export function getServerEnv() {
  return (cached ??= serverSchema.parse(process.env));
}
