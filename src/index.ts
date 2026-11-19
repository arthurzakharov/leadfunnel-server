import { createApp } from '@/app';
import { env } from '@/config/env';
import { onSignalInterrupt, onSignalTerminate } from '@/helpers/server-signals';
import { IustaClient } from '@/modules/iusta/iusta.client';
import { IustaService } from '@/modules/iusta/iusta.service';

const iustaService = new IustaService(new IustaClient(env.IUSTA_URL, env.IUSTA_TOKEN));

const { app } = createApp(
  { corsOrigins: env.CORS_ORIGINS, internalApiKeys: env.INTERNAL_API_KEYS },
  { iustaService }
);

const server = Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`Server is running on ${server.url}`);

process.on('SIGINT', () => onSignalInterrupt(server));

process.on('SIGTERM', () => onSignalTerminate(server));
