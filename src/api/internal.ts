import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { StatusCodes } from 'http-status-codes';
import { msg } from '@/helpers/responses';
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
    .use(
      '*',
      bearerAuth({
        // Required token
        token: config.internalApiKeys,
        // Handle individually different types of authentication errors
        noAuthenticationHeader: {
          message: msg('Missing API key', StatusCodes.UNAUTHORIZED),
        },
        invalidAuthenticationHeader: {
          message: msg('Invalid Authorization header', StatusCodes.BAD_REQUEST),
        },
        invalidToken: {
          message: msg('Invalid API key', StatusCodes.UNAUTHORIZED),
        },
      })
    )
    .route('/iusta', createIustaRoutes(deps.iustaService));
};
