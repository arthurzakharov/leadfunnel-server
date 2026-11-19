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
