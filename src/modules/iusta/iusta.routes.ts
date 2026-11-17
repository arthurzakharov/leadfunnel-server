import { Hono } from 'hono';
import { iustaClient } from '@/modules/iusta/iusta.client';

export const iustaRoutes = new Hono();

iustaRoutes
  // Customer
  .get('/customer/standard-fields/:customerId', async (c) => {
    const { customerId } = c.req.param();
    const response = await iustaClient.getCustomerStandardFields(customerId);

    return c.json(response);
  })
  .get('/customer/custom-fields/:customerId', async (c) => {
    const { customerId } = c.req.param();
    const response = await iustaClient.getCustomerCustomFields(customerId);

    return c.json(response);
  })
  // Case
  .get('/case/standard-fields/:caseId', async (c) => {
    const { caseId } = c.req.param();
    const response = await iustaClient.getCaseStandardFields(caseId);

    return c.json(response);
  })
  .get('/case/custom-fields/:caseId', async (c) => {
    const { caseId } = c.req.param();
    const response = await iustaClient.getCaseCustomFields(caseId);

    return c.json(response);
  });
