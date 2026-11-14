import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { brazeRoutes } from '@/modules/braze/braze.routes';
import { iustaRoutes } from '@/modules/iusta/iusta.routes';
import { leadfunnelRoutes } from '@/modules/leadfunnel/leadfunnel.routes';
import { ovmRoutes } from '@/modules/ovm/ovm.routes';
import { stripeRoutes } from '@/modules/stripe/stripe.routes';
import { msg, msgOk, msg404, msgServerError } from '@/helpers/responses';

const app = new Hono({
  strict: false,
});

app.get('/health', msgOk('Server is running'));

app.notFound(msg404((c) => `${c.req.method} ${c.req.path} does not exist`));

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
