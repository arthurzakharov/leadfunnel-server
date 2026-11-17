import { Hono } from 'hono';

import { zodValidator } from '@/helpers/validator';
import { iustaClient } from '@/modules/iusta/iusta.client';
import { customFieldsQuery, standardFieldsQuery } from '@/modules/iusta/iusta.schemas';
import type {
  IustaCaseStandardFieldKeys,
  IustaCustomerStandardFieldKeys,
  IustaCustomFieldKeys,
} from '@/modules/iusta/iusta.types';

export const iustaRoutes = new Hono()
  .get('/cases/by-external-id/:externalId', async (c) => {
    const { externalId } = c.req.param();
    const response = await iustaClient.resolveIdsByExternalId(externalId);
    return c.json(response);
  })
  .get('/cases/:caseId/standard-fields', zodValidator('query', standardFieldsQuery), async (c) => {
    const { caseId } = c.req.param();
    const { fields } = c.req.valid('query');
    const response = await iustaClient.getCaseStandardFields(
      caseId,
      fields as IustaCaseStandardFieldKeys[]
    );
    return c.json(response);
  })
  .get('/cases/:caseId/custom-fields', zodValidator('query', customFieldsQuery), async (c) => {
    const { caseId } = c.req.param();
    const { ids, fields } = c.req.valid('query');
    const response = await iustaClient.getCaseCustomFields(
      caseId,
      ids,
      fields as IustaCustomFieldKeys[]
    );
    return c.json(response);
  })
  .get(
    '/customers/:customerId/standard-fields',
    zodValidator('query', standardFieldsQuery),
    async (c) => {
      const { customerId } = c.req.param();
      const { fields } = c.req.valid('query');
      const response = await iustaClient.getCustomerStandardFields(
        customerId,
        fields as IustaCustomerStandardFieldKeys[]
      );
      return c.json(response);
    }
  )
  .get(
    '/customers/:customerId/custom-fields',
    zodValidator('query', customFieldsQuery),
    async (c) => {
      const { customerId } = c.req.param();
      const { ids, fields } = c.req.valid('query');
      const response = await iustaClient.getCustomerCustomFields(
        customerId,
        ids,
        fields as IustaCustomFieldKeys[]
      );
      return c.json(response);
    }
  );
