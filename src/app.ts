import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createInternalApi } from '@/api-internal';
import { createPublicApi } from '@/api-public';
import { errorHandler } from '@/helpers/error-handler';
import { msg404, msgOk } from '@/helpers/responses';
import type { IustaService } from '@/modules/iusta/iusta.service';

export type { AppType } from '@/api-public';

interface AppConfig {
  corsOrigins: '*' | string[];
  internalApiKeys: string[];
}

interface AppDeps {
  iustaService: IustaService;
}

export const createApp = (appConfig: AppConfig, appDeps: AppDeps) => {
  const { corsOrigins, internalApiKeys } = appConfig;
  const { iustaService } = appDeps;

  const app = new Hono({
    strict: false,
  });

  // --- Add Hono logger to see incoming request logs ---
  app.use(logger());

  // --- CORS for public API only (/api/*) ---
  app.use(
    '/api/*',
    cors({
      origin: corsOrigins,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Retry-After', 'RateLimit-Limit', 'RateLimit-Remaining'],
      maxAge: 600,
    })
  );

  // --- Health check, 404 and global error handler ---
  app.get('/health', msgOk('Server is up'));

  app.notFound(msg404());

  app.onError(errorHandler);

  // --- Public API (browser apps, typed client, part of AppType) ---
  app.route('/', createPublicApi());

  // --- Internal API (API key only, not part of AppType) ---
  app.route('/', createInternalApi({ internalApiKeys }, { iustaService }));

  return { app };
};
