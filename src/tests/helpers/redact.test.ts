import { describe, expect, test } from 'bun:test';
import { MAX_LOG_BODY_LENGTH, redactForLog } from '@/helpers/redact';

describe('redactForLog', () => {
  test('redacts sensitive JSON keys at any depth, keeps the rest', () => {
    const body = JSON.stringify({
      error: {
        statusCode: 422,
        details: [{ email: 'jane@example.com', iban: 'DE89370400440532013000' }],
      },
      customer: { id: 7, name: 'Jane', surname: 'Doe', dateOfBirth: '1990-01-01' },
      rows: [{ customFieldId: 18943, value: 'secret' }],
    });

    expect(JSON.parse(redactForLog(body))).toEqual({
      error: { statusCode: 422, details: [{ email: '[REDACTED]', iban: '[REDACTED]' }] },
      customer: { id: 7, name: '[REDACTED]', surname: '[REDACTED]', dateOfBirth: '[REDACTED]' },
      rows: [{ customFieldId: 18943, value: '[REDACTED]' }],
    });
  });

  test('matches keys case-insensitively and keeps nulls (no data to hide)', () => {
    expect(redactForLog('{"Email":"a@b.de","phoneNumber":null}')).toBe(
      '{"Email":"[REDACTED]","phoneNumber":null}'
    );
  });

  test('masks personal data inside free text', () => {
    const text =
      "ER_DUP_ENTRY: Duplicate entry 'jane.doe@example.com' for key; " +
      'iban DE89 3704 0044 0532 0130 00; call +49 170 1234567 or 030/1234567';

    const redacted = redactForLog(text);

    expect(redacted).toContain('ER_DUP_ENTRY');
    expect(redacted).toContain('[EMAIL]');
    expect(redacted).toContain('[IBAN]');
    expect(redacted).not.toMatch(/jane|DE89|1234567/);
  });

  test('masks personal data inside JSON string values of non-sensitive keys', () => {
    expect(redactForLog('{"message":"Duplicate entry jane@example.com"}')).toBe(
      '{"message":"Duplicate entry [EMAIL]"}'
    );
  });

  test('leaves ids, statuses and timestamps readable', () => {
    const body = '{"statusCode":500,"caseId":1104638,"at":"2026-11-18T10:00:00Z"}';
    expect(redactForLog(body)).toBe(body);
  });

  test('truncates long bodies', () => {
    const redacted = redactForLog('x'.repeat(MAX_LOG_BODY_LENGTH + 250));

    expect(redacted).toBe(`${'x'.repeat(MAX_LOG_BODY_LENGTH)}… [truncated 250 chars]`);
  });

  test('leaves short non-sensitive text unchanged', () => {
    expect(redactForLog('Internal Server Error')).toBe('Internal Server Error');
  });
});
