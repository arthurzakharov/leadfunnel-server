import { z } from 'zod';
import { baseUrlSchema, httpUrlSchema, requiredStringSchema, splitCsv } from '@/helpers/schemas';

// --- ZOD schema helper functions for env check only ---

// `development` | `production` | `test`. Default: `development`.
export const nodeEnvSchema = z.enum(['development', 'production', 'test']).default('development');

// Integer 1–65535, coerced from string. Default: `3000`.
export const portSchema = z.coerce.number().int().min(1).max(65535).default(3000);

// `true`/`false`/`1`/`0`/`yes`/`no`/`on`/`off` → boolean. Default: `fallback`.
export const booleanSchema = (fallback: boolean) => {
  return z.stringbool().default(fallback);
};

// Required string, at least `minLength` characters (default 32).
export const secretSchema = (name: string, minLength = 32) => {
  return z
    .string({ error: `${name} is required` })
    .min(minLength, `${name} must be at least ${minLength} characters`);
};

// Comma-separated list, at least one item, each at least `minLength` characters (default 32).
export const secretListSchema = (name: string, minLength = 32) => {
  return z
    .string({ error: `${name} is required` })
    .transform(splitCsv)
    .pipe(
      z
        .array(
          z.string().min(minLength, `each ${name} entry must be at least ${minLength} characters`)
        )
        .min(1, `${name} must contain at least one key`)
    );
};

// Required. `*` (any origin) or comma-separated http(s) URLs, normalized to origins, at least one.
export const corsOriginsSchema = (name: string) => {
  return z
    .string({ error: `${name} is required` })
    .trim()
    .pipe(
      z.literal('*').or(
        z
          .string()
          .transform(splitCsv)
          .pipe(
            z
              .array(httpUrlSchema(`${name} entry`).transform((url) => new URL(url).origin))
              .min(1, `${name} must be * or contain at least one origin`)
          )
      )
    );
};

// --- Full application env variables schema ---

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

// --- Extract from schema env types ---
export type EnvConfig = z.infer<typeof envSchema>;
