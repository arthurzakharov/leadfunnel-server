import { Hono } from 'hono';
import { msgOk } from '@/helpers/responses';
import { iustaClient } from '@/modules/iusta/iusta.client';

export const iustaRoutes = new Hono();

iustaRoutes
  .get('/', msgOk('iusta'))
  .get('/case-by-external-id/:externalId', async (c) => {
    const response = await iustaClient.findCaseIdByExternalId(c.req.param().externalId);
    return c.json(response);
  })
  .get('/case-standard-fields-by-case-id/:caseID', async (c) => {
    const response = await iustaClient.getCaseStandardFieldValues(c.req.param().caseID);
    return c.json(response);
  });
