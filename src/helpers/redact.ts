// Helpers to make upstream payloads safe to write to logs: personal data is masked and the
// result is length-limited. Never use the output for business logic, only for logging.

export const MAX_LOG_BODY_LENGTH = 500;

const REDACTED = '[REDACTED]';

const SENSITIVE_KEYS = new Set(
  [
    // personal data (Iusta customer fields)
    'name',
    'surname',
    'company',
    'dateOfBirth',
    'streetAddress',
    'streetNumber',
    'zipCode',
    'city',
    'addressAdditional1',
    'addressAdditional2',
    'addressAdditional3',
    'phoneNumber',
    'mobileNumber',
    'email',
    'fax',
    'iban',
    'bic',
    // custom field values can hold arbitrary personal data
    'value',
    // credentials
    'authorization',
    'token',
    'password',
  ].map((key) => key.toLowerCase())
);

// Fallback for personal data embedded in free text (e.g. SQL error messages).
const TEXT_PATTERNS: [RegExp, string][] = [
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]'],
  [/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]){11,30}\b/g, '[IBAN]'],
  [/(?:\+|\b0)\d[\d\s()/-]{6,}\d/g, '[PHONE]'],
];

const redactValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase()) && inner != null ? REDACTED : redactValue(inner),
      ])
    );
  }
  return value;
};

const redactJsonKeys = (text: string): string => {
  try {
    return JSON.stringify(redactValue(JSON.parse(text)));
  } catch {
    return text;
  }
};

const redactText = (text: string): string =>
  TEXT_PATTERNS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);

const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max)}… [truncated ${text.length - max} chars]` : text;

export const redactForLog = (text: string, max = MAX_LOG_BODY_LENGTH): string =>
  truncate(redactText(redactJsonKeys(text)), max);
