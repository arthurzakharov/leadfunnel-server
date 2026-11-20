import { z } from 'zod';
import { type EnvConfig, envSchema } from '@/config/env.schemas';

// --- Types ---

export type { EnvConfig };

// --- Env service ---

class EnvService {
  // Place where all env values are stored
  public readonly values: EnvConfig;

  constructor(rawEnv: Record<string, unknown>) {
    // Validate raw env against schema
    const parsed = envSchema.safeParse(rawEnv);

    // Fail fast on invalid env
    if (!parsed.success) {
      console.error('Invalid environment variables:');
      console.error(z.prettifyError(parsed.error));
      process.exit(1);
    }

    // Freeze validated values
    this.values = Object.freeze(parsed.data);
  }
}

// --- Validated env singleton ---

export const env = new EnvService(process.env).values;
