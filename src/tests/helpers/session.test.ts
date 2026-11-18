import { describe, expect, setSystemTime, test } from 'bun:test';
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { errorHandler } from '@/helpers/error-handler';
import { createSessionManager, type SessionVariables } from '@/helpers/session';

const SECRET = 's'.repeat(32);
const sessions = createSessionManager({ secret: SECRET, ttlSeconds: 60 });
const ovmSession = { app: 'ovm', caseId: '42', customerId: '7' } as const;

const protectedApp = () => {
  const app = new Hono<{ Variables: SessionVariables }>();
  app.onError(errorHandler);
  app.get('/ovm/me', sessions.requireSession('ovm'), (c) => c.json(c.get('session')));
  return app;
};

const call = (authorization?: string) =>
  protectedApp().request('/ovm/me', {
    headers: authorization ? { Authorization: authorization } : {},
  });

describe('createSessionManager', () => {
  test('create → read round-trips the session and reports the expiry', async () => {
    setSystemTime(new Date('2026-11-18T10:00:00Z'));
    const { token, expiresAt } = await sessions.create(ovmSession);
    setSystemTime();

    expect(expiresAt).toBe('2026-11-18T10:01:00.000Z');
    expect(await sessions.read(token).catch(() => 'expired')).toBe('expired');

    const fresh = await sessions.create(ovmSession);
    expect(await sessions.read(fresh.token)).toEqual(ovmSession);
  });

  test('rejects tokens signed with another secret', async () => {
    const forged = await createSessionManager({ secret: 'x'.repeat(32) }).create(ovmSession);

    const error = await sessions.read(forged.token).catch((e) => e);

    expect(error.status).toBe(401);
  });

  test('rejects validly signed tokens with an unexpected payload', async () => {
    const token = await sign({ app: 'admin', caseId: '1', exp: Date.now() / 1000 + 60 }, SECRET);

    expect((await sessions.read(token).catch((e) => e)).status).toBe(401);
  });

  test('rejects the "none" algorithm', async () => {
    const header = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url');
    const payload = Buffer.from(JSON.stringify({ ...ovmSession, exp: 9e9 })).toString('base64url');

    expect((await sessions.read(`${header}.${payload}.`).catch((e) => e)).status).toBe(401);
  });
});

describe('requireSession middleware', () => {
  test('passes the session to the handler', async () => {
    const { token } = await sessions.create(ovmSession);

    const res = await call(`Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(ovmSession);
  });

  test.each([
    [undefined, 'Missing session token'],
    ['Basic abc', 'Missing session token'],
    ['Bearer not-a-jwt', 'Invalid or expired session'],
  ])('401 for Authorization=%p', async (authorization, message) => {
    const res = await call(authorization);

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ message });
  });

  test('403 when the session belongs to another app', async () => {
    const { token } = await sessions.create({ ...ovmSession, app: 'leadfunnel' });

    const res = await call(`Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ message: 'Session is not valid for ovm' });
  });
});
