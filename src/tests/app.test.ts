import { beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { createApp } from '@/app';
import { IustaClient } from '@/modules/iusta/iusta.client';
import { IustaService } from '@/modules/iusta/iusta.service';

const KEY = 'k'.repeat(32);
const ALLOWED = 'https://leadfunnel.example.com';

const iustaService = new IustaService(new IustaClient('http://iusta.invalid', 'x'));
const resolveIds = spyOn(iustaService, 'resolveIdsByExternalId');

const build = (internalApiKeys: string[] = [KEY]) =>
  createApp({ corsOrigins: [ALLOWED], internalApiKeys }, { iustaService }).app;

beforeEach(() => {
  resolveIds.mockReset();
  resolveIds.mockResolvedValue({ caseId: '42', customerId: '7' });
});

describe('public API', () => {
  test('health is open', async () => {
    expect((await build().request('/health')).status).toBe(200);
  });

  test('iusta routes are no longer public', async () => {
    const res = await build().request('/api/v1/iusta/cases/by-external-id/ext-1');

    expect(res.status).toBe(404);
    expect(resolveIds).not.toHaveBeenCalled();
  });
});

describe('CORS', () => {
  const preflight = (origin: string) =>
    build().request('/api/v1/leadfunnel', {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
    });

  test('allows whitelisted origins with the needed headers', async () => {
    const res = await preflight(ALLOWED);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED);
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  test('does not allow other origins', async () => {
    const res = await preflight('https://evil.example.com');

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  test('is not applied to internal routes', async () => {
    const res = await build().request('/internal/iusta/cases/by-external-id/ext-1', {
      headers: { Origin: ALLOWED, Authorization: `Bearer ${KEY}` },
    });

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('internal API', () => {
  const internal = (app: ReturnType<typeof build>, authorization?: string) =>
    app.request('/internal/iusta/cases/by-external-id/ext-1', {
      headers: authorization ? { Authorization: authorization } : {},
    });

  test('works with a valid API key', async () => {
    const res = await internal(build(), `Bearer ${KEY}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ caseId: '42', customerId: '7' });
  });

  test('accepts any of several keys (rotation)', async () => {
    const other = 'o'.repeat(32);

    expect((await internal(build([KEY, other]), `Bearer ${other}`)).status).toBe(200);
  });

  test.each([
    [undefined, 401],
    ['Bearer wrong-key', 401],
    [`Basic ${KEY}`, 400],
  ])('rejects Authorization=%p with %i', async (authorization, status) => {
    const res = await internal(build(), authorization);

    expect(res.status).toBe(status);
    expect(resolveIds).not.toHaveBeenCalled();
  });

  test('is not mounted at all when no keys are configured', async () => {
    const res = await internal(build([]), `Bearer ${KEY}`);

    expect(res.status).toBe(404);
    expect(resolveIds).not.toHaveBeenCalled();
  });
});
