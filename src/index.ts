import { serve } from '@hono/node-server';
import app from '@/app';
import { onSignalInterrupt, onSignalTerminate } from '@/helpers/server-signals';
import { env } from '@/config/env';

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => console.log(`Server is running on http://localhost:${info.port}`)
);

process.on('SIGINT', () => onSignalInterrupt(server));

process.on('SIGTERM', () => onSignalTerminate(server));
