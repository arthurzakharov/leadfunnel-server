import { Hono } from 'hono';
import { brazeRoutes } from '@/modules/braze/braze.routes';
import { leadfunnelRoutes } from '@/modules/leadfunnel/leadfunnel.routes';
import { ovmRoutes } from '@/modules/ovm/ovm.routes';
import { stripeRoutes } from '@/modules/stripe/stripe.routes';

// --- Public API: called from browsers, exposed to the typed client via AppType ---

export const createPublicApi = () => {
  return new Hono()
    .basePath('/api/v1')
    .route('/braze', brazeRoutes)
    .route('/leadfunnel', leadfunnelRoutes)
    .route('/ovm', ovmRoutes)
    .route('/stripe', stripeRoutes);
};

// --- Types ---

export type AppType = ReturnType<typeof createPublicApi>;
