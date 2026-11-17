import { Hono } from 'hono';
import { msgOk } from '@/helpers/responses';

export const leadfunnelRoutes = new Hono().get('/', msgOk('leadfunnel'));
