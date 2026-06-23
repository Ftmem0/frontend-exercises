import type { KeyValue, RequestConfig } from '../types';

export const validateUrl = (value: string): string | null => {
  if (!value.trim()) return 'URL is required.';
  if (!/^https?:\/\//i.test(value.trim())) return 'URL must start with http:// or https://.';

  try {
    new URL(value.trim());
    return null;
  } catch {
    return 'URL format is invalid.';
  }
};

export const buildFinalUrl = (request: RequestConfig): string => {
  const url = new URL(request.url.trim());

  request.params
    .filter((param) => param.enabled && param.key.trim())
    .forEach((param) => url.searchParams.set(param.key.trim(), param.value));

  return url.toString();
};

export const keyValueToObject = (rows: KeyValue[]): Record<string, string> => {
  return rows
    .filter((row) => row.enabled && row.key.trim())
    .reduce<Record<string, string>>((acc, row) => {
      acc[row.key.trim()] = row.value;
      return acc;
    }, {});
};

export const prettifyResponseBody = (text: string, contentType: string | null): string => {
  if (!text) return '';

  const looksJson = contentType?.includes('application/json') || /^[\s\n\r]*[{[]/.test(text);
  if (!looksJson) return text;

  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};
