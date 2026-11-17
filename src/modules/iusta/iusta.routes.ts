import { Hono } from 'hono';
import { zodValidator } from '@/helpers/validator';
import { iustaClient } from '@/modules/iusta/iusta.client';
import {
  caseStandardFieldsQuery,
  customerStandardFieldsQuery,
  customFieldsQuery,
} from '@/modules/iusta/iusta.schemas';

export const iustaRoutes = new Hono()
  // --- Main entry point ---
  .get('/cases/by-external-id/:externalId', async (c) => {
    const { externalId } = c.req.param();
    const response = await iustaClient.resolveIdsByExternalId(externalId);
    return c.json(response);
  })
  // --- Cases ---
  .get(
    '/cases/:caseId/standard-fields',
    zodValidator('query', caseStandardFieldsQuery),
    async (c) => {
      const { caseId } = c.req.param();
      const { fields } = c.req.valid('query');
      const response = await iustaClient.getCaseStandardFields(caseId, fields);
      return c.json(response);
    }
  )
  .get('/cases/:caseId/custom-fields', zodValidator('query', customFieldsQuery), async (c) => {
    const { caseId } = c.req.param();
    const { ids, fields } = c.req.valid('query');
    const response = await iustaClient.getCaseCustomFields(caseId, ids, fields);
    return c.json(response);
  })
  // --- Customers ---
  .get(
    '/customers/:customerId/standard-fields',
    zodValidator('query', customerStandardFieldsQuery),
    async (c) => {
      const { customerId } = c.req.param();
      const { fields } = c.req.valid('query');
      const response = await iustaClient.getCustomerStandardFields(customerId, fields);
      return c.json(response);
    }
  )
  .get(
    '/customers/:customerId/custom-fields',
    zodValidator('query', customFieldsQuery),
    async (c) => {
      const { customerId } = c.req.param();
      const { ids, fields } = c.req.valid('query');
      const response = await iustaClient.getCustomerCustomFields(customerId, ids, fields);
      return c.json(response);
    }
  );
