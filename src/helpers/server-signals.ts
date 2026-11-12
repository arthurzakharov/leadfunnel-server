import type { ServerType } from '@hono/node-server';

export const onSignalInterrupt = (server: ServerType) => {
  server.close();
  console.log('Server closed 1');
  process.exit(0);
};

export const onSignalTerminate = (server: ServerType) => {
  server.close((err) => {
    console.log('Server closed 2');
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
};
