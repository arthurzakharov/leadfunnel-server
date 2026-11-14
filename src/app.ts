import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { msg, msg404, msgOk, msgServerError } from '@/helpers/responses';
import { brazeRoutes } from '@/modules/braze/braze.routes';
import { iustaRoutes } from '@/modules/iusta/iusta.routes';
import { leadfunnelRoutes } from '@/modules/leadfunnel/leadfunnel.routes';
import { ovmRoutes } from '@/modules/ovm/ovm.routes';
import { stripeRoutes } from '@/modules/stripe/stripe.routes';

const app = new Hono({
  strict: false,
});

app.use(logger());

app.get('/health', msgOk('Server is up'));

app.notFound(msg404());

app.onError((e, c) => {
  console.error(e);
  return e instanceof HTTPException
    ? e.res || msg(e.message, e.status)(c)
    : msgServerError(e.message)(c);
});

const apiV1 = app
  .basePath('/api/v1')
  .route('/braze', brazeRoutes)
  .route('/iusta', iustaRoutes)
  .route('/leadfunnel', leadfunnelRoutes)
  .route('/ovm', ovmRoutes)
  .route('/stripe', stripeRoutes);

export type AppType = typeof apiV1;

export default app;
