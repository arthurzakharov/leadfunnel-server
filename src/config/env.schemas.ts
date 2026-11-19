import { z } from 'zod';
import {
  baseUrlSchema,
  booleanSchema,
  corsOriginsSchema,
  nodeEnvSchema,
  portSchema,
  requiredStringSchema,
  secretListSchema,
  secretSchema,
} from '@/helpers/zod-schemas';

export const envSchema = z.object({
  // --- Optional env variables ---

  NODE_ENV: nodeEnvSchema,
  PORT: portSchema,
  TRUST_PROXY: booleanSchema(false),

  // --- Required env variables ---

  IUSTA_TOKEN: requiredStringSchema('IUSTA_TOKEN'),
  IUSTA_URL: baseUrlSchema('IUSTA_URL'),
  CORS_ORIGINS: corsOriginsSchema('CORS_ORIGINS'),
  JWT_SECRET: secretSchema('JWT_SECRET'),
  INTERNAL_API_KEYS: secretListSchema('INTERNAL_API_KEYS'),
});

export type EnvConfig = z.infer<typeof envSchema>;
