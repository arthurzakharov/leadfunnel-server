import { type ClientRequestOptions, hc } from 'hono/client';
import type { AppType } from '@/api-public';

export {
  type ClientResponse,
  DetailedError,
  type InferRequestType,
  type InferResponseType,
  parseResponse,
} from 'hono/client';
export type { AppType };

type MaybePromise<T> = T | Promise<T>;

export type LeadfunnelClientOptions = ClientRequestOptions & {
  getSessionToken?: () => MaybePromise<string | null | undefined>;
};

const createTypedClient = (baseUrl: string, options?: ClientRequestOptions) =>
  hc<AppType>(baseUrl, options);

export type LeadfunnelClient = ReturnType<typeof createTypedClient>;

export const createClient = (
  baseUrl: string,
  { getSessionToken, headers, ...options }: LeadfunnelClientOptions = {}
): LeadfunnelClient =>
  createTypedClient(baseUrl, {
    ...options,
    headers: async () => {
      const baseHeaders = typeof headers === 'function' ? await headers() : (headers ?? {});
      const token = await getSessionToken?.();

      return token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;
    },
  });
