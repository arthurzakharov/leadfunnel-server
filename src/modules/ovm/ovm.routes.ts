import { Hono } from 'hono';
import { msgOk } from '@/helpers/responses';

export const ovmRoutes = new Hono().get('/', msgOk('ovm'));
