import { createMiddleware } from 'hono/factory';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { ForbiddenError, UnauthorizedError } from '@/helpers/errors';

const ALGORITHM = 'HS256';

export const sessionAppSchema = z.enum(['leadfunnel', 'ovm']);

export type SessionApp = z.infer<typeof sessionAppSchema>;

const sessionSchema = z.object({
  app: sessionAppSchema,
  caseId: z.string().min(1),
  customerId: z.string().min(1),
});

export type Session = z.infer<typeof sessionSchema>;

export type SessionVariables = { session: Session };

export interface SessionManagerOptions {
  secret: string;
  ttlSeconds?: number;
}

export const createSessionManager = ({ secret, ttlSeconds = 3600 }: SessionManagerOptions) => {
  const create = async (session: Session) => {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + ttlSeconds;
    const token = await sign({ ...session, iat: issuedAt, exp: expiresAt }, secret, ALGORITHM);

    return { token, expiresAt: new Date(expiresAt * 1000).toISOString() };
  };

  const read = async (token: string): Promise<Session> => {
    const payload = await verify(token, secret, ALGORITHM).catch(() => null);
    const parsed = sessionSchema.safeParse(payload);

    if (!parsed.success) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    return parsed.data;
  };

  const requireSession = (app: SessionApp) =>
    createMiddleware<{ Variables: SessionVariables }>(async (c, next) => {
      const token = c.req.header('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];

      if (!token) {
        throw new UnauthorizedError('Missing session token');
      }

      const session = await read(token);

      if (session.app !== app) {
        throw new ForbiddenError(`Session is not valid for ${app}`);
      }

      c.set('session', session);
      await next();
    });

  return { create, read, requireSession };
};

export type SessionManager = ReturnType<typeof createSessionManager>;
