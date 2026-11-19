import { z } from 'zod';

// Splits a comma-separated string into trimmed, non-empty items. Empty input → `[]`.
export const splitCsv = (value?: string) => {
  return value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
};

// Required string, trimmed, not empty.
export const requiredStringSchema = (name: string) => {
  return z
    .string({ error: `${name} is required` })
    .trim()
    .min(1, `${name} cannot be empty`);
};

// Valid URL with `http` or `https` protocol.
export const httpUrlSchema = (name: string) => {
  return z
    .url({ error: `${name} must be a valid URL` })
    .trim()
    .refine((url) => /^https?:\/\//.test(url), {
      error: `${name} must use http or https protocol`,
    });
};

// `httpUrlSchema` with trailing slashes removed.
export const baseUrlSchema = (name: string) => {
  return httpUrlSchema(name).transform((url) => url.replace(/\/+$/, ''));
};

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
