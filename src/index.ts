import app from '@/app';
import { env } from '@/config/env';
import { onSignalInterrupt, onSignalTerminate } from '@/helpers/server-signals';

const server = Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
});

console.log(`Server is running on ${server.url}`);

process.on('SIGINT', () => onSignalInterrupt(server));

process.on('SIGTERM', () => onSignalTerminate(server));
