import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createPublicApi } from '@/api';
import { errorHandler } from '@/helpers/error-handler';
import { msg404, msgOk } from '@/helpers/responses';
import { createIustaRoutes } from '@/modules/iusta/iusta.routes';
import type { IustaService } from '@/modules/iusta/iusta.service';

export type { AppType } from '@/api';

export interface AppConfig {
  corsOrigins: string[];
  internalApiKeys: string[];
}

export interface AppDeps {
  iustaService: IustaService;
}

export const createApp = ({ corsOrigins, internalApiKeys }: AppConfig, deps: AppDeps) => {
  const app = new Hono({
    strict: false,
  });

  app.use(logger());

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

  app.get('/health', msgOk('Server is up'));

  app.notFound(msg404());

  app.onError(errorHandler);

  // --- Public API (browser apps, typed client) ---
  app.route('/', createPublicApi());

  // --- Internal API (API key only, not part of AppType) ---
  if (internalApiKeys.length > 0) {
    app
      .basePath('/internal')
      .use('*', bearerAuth({ token: internalApiKeys }))
      .route('/iusta', createIustaRoutes(deps.iustaService));
  }

  return { app };
};
