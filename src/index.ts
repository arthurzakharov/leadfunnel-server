import { serve } from '@hono/node-server';
import app from './app';
import { onSignalInterrupt, onSignalTerminate } from './helpers/server-signals';

const server = serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT),
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

process.on('SIGINT', () => onSignalInterrupt(server));
process.on('SIGTERM', () => onSignalTerminate(server));
