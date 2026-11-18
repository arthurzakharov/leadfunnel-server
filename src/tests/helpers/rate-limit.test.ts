import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import { errorHandler } from '@/helpers/error-handler';
import { clientIp, rateLimit } from '@/helpers/rate-limit';

const limitedApp = (time: { now: number }, limit = 2, trustProxy = false) => {
  const app = new Hono();
  app.onError(errorHandler);
  app.post(
    '/session',
    rateLimit({ windowMs: 60_000, limit, trustProxy, now: () => time.now }),
    (c) => c.text('ok')
  );
  return app;
};

const hit = (app: Hono, forwardedFor = '1.1.1.1') =>
  app.request('/session', { method: 'POST', headers: { 'x-forwarded-for': forwardedFor } });

describe('rateLimit', () => {
  test('allows up to the limit, then returns 429 with Retry-After', async () => {
    const time = { now: 0 };
    const app = limitedApp(time, 2, true);

    const first = await hit(app);
    expect(first.status).toBe(200);
    expect(first.headers.get('RateLimit-Remaining')).toBe('1');
    expect((await hit(app)).status).toBe(200);

    time.now = 45_000;
    const blocked = await hit(app);

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBe('15');
    expect(blocked.headers.get('RateLimit-Remaining')).toBe('0');
    expect(await blocked.json()).toMatchObject({ code: 429 });
  });

  test('resets after the window', async () => {
    const time = { now: 0 };
    const app = limitedApp(time, 1, true);

    await hit(app);
    expect((await hit(app)).status).toBe(429);

    time.now = 60_000;
    expect((await hit(app)).status).toBe(200);
  });

  test('counts each client separately', async () => {
    const app = limitedApp({ now: 0 }, 1, true);

    expect((await hit(app, '1.1.1.1')).status).toBe(200);
    expect((await hit(app, '2.2.2.2')).status).toBe(200);
    expect((await hit(app, '1.1.1.1')).status).toBe(429);
  });

  test('ignores X-Forwarded-For unless the proxy is trusted', async () => {
    const app = limitedApp({ now: 0 }, 1, false);

    expect((await hit(app, '1.1.1.1')).status).toBe(200);
    expect((await hit(app, '2.2.2.2')).status).toBe(429);
  });
});

describe('clientIp', () => {
  const ipOf = async (forwardedFor: string, trustProxy: boolean) => {
    const app = new Hono();
    app.get('/', (c) => c.text(clientIp(c, trustProxy)));
    return (await app.request('/', { headers: { 'x-forwarded-for': forwardedFor } })).text();
  };

  test('uses the address added by the trusted proxy (last entry), not a spoofed first one', async () => {
    expect(await ipOf('6.6.6.6, 1.2.3.4', true)).toBe('1.2.3.4');
  });

  test('falls back to "unknown" without a socket address', async () => {
    expect(await ipOf('1.2.3.4', false)).toBe('unknown');
  });
});
