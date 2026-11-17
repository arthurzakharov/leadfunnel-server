import axios, { type RawAxiosRequestHeaders } from 'axios';

export const createHttpClient = (
  baseURL = '',
  headers: RawAxiosRequestHeaders = {},
  timeout = 15_000
) => {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    paramsSerializer: {
      serialize: (params) => {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value === undefined) continue;
          searchParams.append(
            key,
            value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value)
          );
        }
        return searchParams.toString();
      },
    },
  });
};
