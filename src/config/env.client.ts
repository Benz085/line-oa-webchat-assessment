import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_LINE_OA_URL: z.string().url().optional(),
});

// Client vars must be referenced literally so Next can inline them at build time
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_LINE_OA_URL: process.env.NEXT_PUBLIC_LINE_OA_URL || undefined,
});
