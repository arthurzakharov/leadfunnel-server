import { Hono } from 'hono';
import { zodValidator } from '@/helpers/validator';
import {
  caseIdParam,
  caseStandardFieldsQuery,
  customerIdParam,
  customerStandardFieldsQuery,
  customFieldsQuery,
  externalIdParam,
} from '@/modules/iusta/iusta.schemas';
import type { IustaService } from '@/modules/iusta/iusta.service';

export const createIustaRoutes = (iustaService: IustaService) =>
  new Hono()
    // --- Main entry point ---
    .get('/cases/by-external-id/:externalId', zodValidator('param', externalIdParam), async (c) => {
      const { externalId } = c.req.valid('param');
      const response = await iustaService.resolveIdsByExternalId(externalId);
      return c.json(response);
    })
    // --- Cases ---
    .get(
      '/cases/:caseId/standard-fields',
      zodValidator('param', caseIdParam),
      zodValidator('query', caseStandardFieldsQuery),
      async (c) => {
        const { caseId } = c.req.valid('param');
        const { fields } = c.req.valid('query');
        const response = await iustaService.getCaseStandardFields(caseId, fields);
        return c.json(response);
      }
    )
    .get(
      '/cases/:caseId/custom-fields',
      zodValidator('param', caseIdParam),
      zodValidator('query', customFieldsQuery),
      async (c) => {
        const { caseId } = c.req.valid('param');
        const { ids, fields } = c.req.valid('query');
        const response = await iustaService.getCaseCustomFields(caseId, ids, fields);
        return c.json(response);
      }
    )
    // --- Customers ---
    .get(
      '/customers/:customerId/standard-fields',
      zodValidator('param', customerIdParam),
      zodValidator('query', customerStandardFieldsQuery),
      async (c) => {
        const { customerId } = c.req.valid('param');
        const { fields } = c.req.valid('query');
        const response = await iustaService.getCustomerStandardFields(customerId, fields);
        return c.json(response);
      }
    )
    .get(
      '/customers/:customerId/custom-fields',
      zodValidator('param', customerIdParam),
      zodValidator('query', customFieldsQuery),
      async (c) => {
        const { customerId } = c.req.valid('param');
        const { ids, fields } = c.req.valid('query');
        const response = await iustaService.getCustomerCustomFields(customerId, ids, fields);
        return c.json(response);
      }
    );
