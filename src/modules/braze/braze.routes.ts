import { Hono } from 'hono';
import { msgOk } from '@/helpers/responses';

export const brazeRoutes = new Hono().get('/', msgOk('braze'));
