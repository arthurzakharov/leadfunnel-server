import { z } from 'zod';

const splitCsv = (val: string) =>
  val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const httpUrl = (name: string) =>
  z
    .url({ error: `${name} must be a valid URL` })
    .trim()
    .refine((url) => /^https?:\/\//.test(url), {
      error: `${name} must use http or https protocol`,
    });

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  IUSTA_TOKEN: z
    .string({ error: 'IUSTA_TOKEN is required' })
    .trim()
    .min(1, 'IUSTA_TOKEN cannot be empty'),
  IUSTA_URL: httpUrl('IUSTA_URL').transform((url) => url.replace(/\/+$/, '')),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform(splitCsv)
    .pipe(z.array(httpUrl('CORS_ORIGINS entry').transform((url) => new URL(url).origin))),
  JWT_SECRET: z
    .string({ error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  INTERNAL_API_KEYS: z
    .string({ error: 'INTERNAL_API_KEYS is required' })
    .transform(splitCsv)
    .pipe(
      z
        .array(z.string().min(32, 'each INTERNAL_API_KEYS entry must be at least 32 characters'))
        .min(1, 'INTERNAL_API_KEYS must contain at least one key')
    ),
  TRUST_PROXY: z.stringbool().default(false),
});

export type EnvConfig = z.infer<typeof envSchema>;
