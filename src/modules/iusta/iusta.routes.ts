import { Hono } from 'hono';
import { msgOk } from '../../helpers/responses';

export const iustaRoutes = new Hono().get('/', msgOk('iusta'));
