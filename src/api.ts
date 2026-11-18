import { Hono } from 'hono';
import { brazeRoutes } from '@/modules/braze/braze.routes';
import { leadfunnelRoutes } from '@/modules/leadfunnel/leadfunnel.routes';
import { ovmRoutes } from '@/modules/ovm/ovm.routes';
import { stripeRoutes } from '@/modules/stripe/stripe.routes';

export const createPublicApi = () =>
  new Hono()
    .basePath('/api/v1')
    .route('/braze', brazeRoutes)
    .route('/leadfunnel', leadfunnelRoutes)
    .route('/ovm', ovmRoutes)
    .route('/stripe', stripeRoutes);

export type AppType = ReturnType<typeof createPublicApi>;
