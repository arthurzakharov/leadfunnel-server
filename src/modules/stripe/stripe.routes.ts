import { Hono } from 'hono';
import { msgOk } from '@/helpers/responses';

export const stripeRoutes = new Hono().get('/', msgOk('stripe'));
