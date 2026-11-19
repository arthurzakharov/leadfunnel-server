import { describe, expect, test } from 'bun:test';
import { envSchema } from '@/config/env.schema';

const KEY = 'k'.repeat(32);

const base = {
  IUSTA_URL: 'https://iusta.example.com/api/',
  IUSTA_TOKEN: 'token',
  JWT_SECRET: 's'.repeat(32),
  INTERNAL_API_KEYS: KEY,
  CORS_ORIGINS: 'https://leadfunnel.example.com',
};

const parse = (overrides: Record<string, string> = {}) =>
  envSchema.safeParse({ ...base, ...overrides });

describe('envSchema', () => {
  test.each(['0', '65536', '3.5', 'abc'])('rejects PORT=%p', (value) => {
    expect(parse({ PORT: value }).success).toBe(false);
  });

  test('applies safe defaults for the new variables', () => {
    const result = parse();

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      IUSTA_URL: 'https://iusta.example.com/api',
      TRUST_PROXY: false,
    });
  });

  test('CORS_ORIGINS is a comma-separated list normalised to origins', () => {
    const result = parse({
      CORS_ORIGINS: ' https://leadfunnel.example.com/ , http://localhost:5173/some/path ,',
    });

    expect(result.data?.CORS_ORIGINS).toEqual([
      'https://leadfunnel.example.com',
      'http://localhost:5173',
    ]);
  });

  test('CORS_ORIGINS is required and cannot be empty', () => {
    const { CORS_ORIGINS: _, ...withoutOrigins } = base;

    expect(envSchema.safeParse(withoutOrigins).success).toBe(false);
    expect(parse({ CORS_ORIGINS: '' }).success).toBe(false);
    expect(parse({ CORS_ORIGINS: ' , ' }).success).toBe(false);
  });

  test('CORS_ORIGINS=* allows all origins', () => {
    expect(parse({ CORS_ORIGINS: ' * ' }).data?.CORS_ORIGINS).toBe('*');
  });

  test.each(['not-a-url', 'ftp://example.com', '*,https://leadfunnel.example.com'])(
    'rejects CORS origin %p',
    (origin) => {
      expect(parse({ CORS_ORIGINS: origin }).success).toBe(false);
    }
  );

  test('JWT_SECRET is required and must be at least 32 characters', () => {
    const { JWT_SECRET: _, ...withoutSecret } = base;

    expect(envSchema.safeParse(withoutSecret).success).toBe(false);
    expect(parse({ JWT_SECRET: 'short' }).success).toBe(false);
  });

  test('INTERNAL_API_KEYS is required and must contain at least one key', () => {
    const { INTERNAL_API_KEYS: _, ...withoutKeys } = base;

    expect(envSchema.safeParse(withoutKeys).success).toBe(false);
    expect(parse({ INTERNAL_API_KEYS: '' }).success).toBe(false);
    expect(parse({ INTERNAL_API_KEYS: ' , ' }).success).toBe(false);
  });

  test('INTERNAL_API_KEYS supports several keys for rotation, each at least 32 characters', () => {
    const other = 'o'.repeat(32);

    expect(parse({ INTERNAL_API_KEYS: `${KEY}, ${other}` }).data?.INTERNAL_API_KEYS).toEqual([
      KEY,
      other,
    ]);
    expect(parse({ INTERNAL_API_KEYS: `${KEY},short` }).success).toBe(false);
  });

  test.each([
    ['true', true],
    ['1', true],
    ['false', false],
    ['0', false],
  ])('TRUST_PROXY=%p is parsed as %p', (value, expected) => {
    expect(parse({ TRUST_PROXY: value }).data?.TRUST_PROXY).toBe(expected);
  });
});
