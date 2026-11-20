import axios, { type RawAxiosRequestHeaders } from 'axios';

// Preconfigured axios instance for upstream APIs: base URL, JSON headers and timeout (ms)
export const createHttpClient = (
  baseURL: string = '',
  headers: RawAxiosRequestHeaders = {},
  timeout: number = 15_000
) => {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    // Objects go to the query as JSON (?filter={"where":...}), as Iusta (LoopBack) expects,
    // instead of axios' default filter[where][...]=... Undefined values are skipped.
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
