import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { createIustaRoutes } from '@/modules/iusta/iusta.routes';
import type { IustaService } from '@/modules/iusta/iusta.service';

// --- Types ---

export interface InternalApiConfig {
  internalApiKeys: string[];
}

export interface InternalApiDeps {
  iustaService: IustaService;
}

// --- Internal API: server-to-server only, behind Bearer auth, not part of AppType ---

export const createInternalApi = (config: InternalApiConfig, deps: InternalApiDeps) => {
  return new Hono()
    .basePath('/internal')
    .use('*', bearerAuth({ token: config.internalApiKeys }))
    .route('/iusta', createIustaRoutes(deps.iustaService));
};
