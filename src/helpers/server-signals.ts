type Server = ReturnType<typeof Bun.serve>;
const shutdown = async (server: Server, signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  try {
    await server.stop();
    console.log("Server closed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

export const onSignalInterrupt = (server: Server) => {
  void shutdown(server, "SIGINT");
};

export const onSignalTerminate = (server: Server) => {
  void shutdown(server, "SIGTERM");
};
