import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  IUSTA_TOKEN: z
    .string({ error: 'IUSTA_TOKEN is required' })
    .trim()
    .min(1, 'IUSTA_TOKEN cannot be empty'),
  IUSTA_URL: z
    .url({ error: 'IUSTA_URL must be a valid URL' })
    .trim()
    .refine((url) => /^https?:\/\//.test(url), {
      error: 'IUSTA_URL must use http or https protocol',
    })
    .transform((url) => url.replace(/\/+$/, '')),
});

export type EnvConfig = z.infer<typeof envSchema>;

class EnvService {
  public readonly values: EnvConfig;

  constructor(rawEnv: Record<string, unknown>) {
    const parsed = envSchema.safeParse(rawEnv);

    if (!parsed.success) {
      console.error('Invalid environment variables:');
      console.error(z.prettifyError(parsed.error));
      process.exit(1);
    }

    this.values = Object.freeze(parsed.data);
  }
}

export const env = new EnvService(process.env).values;
