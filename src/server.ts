import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./db/connection.js";

async function main() {
  await connectDatabase();
  console.log("MongoDB conectado");

  const server = createApp().listen(env.PORT, () => {
    console.log(`Calibre back-end em http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} recebido, encerrando...`);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Falha ao iniciar:", err);
  process.exit(1);
});
