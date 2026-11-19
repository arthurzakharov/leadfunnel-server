import { createApp } from '@/app';
import { env } from '@/config/env';
import { onSignalInterrupt, onSignalTerminate } from '@/helpers/server-signals';
import { IustaClient } from '@/modules/iusta/iusta.client';
import { IustaService } from '@/modules/iusta/iusta.service';

// ---  Create application with configs dependencies ---

const { app } = createApp(
  { corsOrigins: env.CORS_ORIGINS, internalApiKeys: env.INTERNAL_API_KEYS },
  { iustaService: new IustaService(new IustaClient(env.IUSTA_URL, env.IUSTA_TOKEN)) }
);

// --- Run server ---

const server = Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`Server is running on ${server.url}`);

// --- Handle server shut dowm ---

process.on('SIGINT', () => onSignalInterrupt(server));
process.on('SIGTERM', () => onSignalTerminate(server));
