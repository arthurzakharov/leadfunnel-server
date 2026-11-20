// --- Types ---

type Server = ReturnType<typeof Bun.serve>;

// --- Graceful shutdown ---

const shutdown = async (server: Server, signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  try {
    // Stops accepting new connections and waits for in-flight requests to finish
    await server.stop();
    console.log('Server closed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// --- Specific signals handlers ---

// Ctrl+C in the terminal (local development)
export const onSignalInterrupt = (server: Server) => {
  void shutdown(server, 'SIGINT');
};

// `docker stop` / orchestrator; SIGKILL follows if we don't exit in time (Docker: 10s)
export const onSignalTerminate = (server: Server) => {
  void shutdown(server, 'SIGTERM');
};
