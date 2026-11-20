import axios, { type CreateAxiosDefaults, type RawAxiosRequestHeaders } from 'axios';

// Preconfigured axios instance for upstream APIs: base URL, JSON headers and timeout (ms).
export const createHttpClient = (
  baseURL: string = '',
  headers: RawAxiosRequestHeaders = {},
  timeout: number = 15_000,
  config: CreateAxiosDefaults = {}
) => {
  return axios.create({
    ...config,
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
};
