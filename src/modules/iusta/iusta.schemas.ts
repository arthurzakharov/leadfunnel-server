import { z } from 'zod';

const csvStringsSchema = z
  .string()
  .optional()
  .transform((val) =>
    val
      ? val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  );

const csvIdsSchema = z
  .string()
  .optional()
  .transform((val) =>
    val
      ? val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((id) => (/^\d+$/.test(id) ? Number(id) : id))
      : []
  );

export const standardFieldsQuery = z.object({
  fields: csvStringsSchema,
});

export const customFieldsQuery = z.object({
  ids: csvIdsSchema,
  fields: csvStringsSchema,
});
