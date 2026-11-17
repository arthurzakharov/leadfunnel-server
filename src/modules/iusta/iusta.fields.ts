export const IUSTA_CUSTOM_FIELD_IDS = {
  CASE_EXTERNAL_ID: 18943,
} as const;

export type IustaCustomFieldName = keyof typeof IUSTA_CUSTOM_FIELD_IDS;
