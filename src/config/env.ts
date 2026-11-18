import { z } from 'zod';
import { type EnvConfig, envSchema } from '@/config/env.schema';

export type { EnvConfig };

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
