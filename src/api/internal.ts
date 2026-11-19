import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { createIustaRoutes } from '@/modules/iusta/iusta.routes';
import type { IustaService } from '@/modules/iusta/iusta.service';

export interface InternalApiConfig {
  internalApiKeys: string[];
}

export interface InternalApiDeps {
  iustaService: IustaService;
}

export const createInternalApi = (config: InternalApiConfig, deps: InternalApiDeps) =>
  new Hono()
    .basePath('/internal')
    .use('*', bearerAuth({ token: config.internalApiKeys }))
    .route('/iusta', createIustaRoutes(deps.iustaService));
