import mongoose from "mongoose";
import { env } from "../config/env.js";

/**
 * Conexão única com o Atlas, reaproveitada por todos os repositories.
 * O Mongoose mantém o pool internamente — não abrir conexão por request.
 */
export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI);

  // Cria os índices declarados nos schemas. O índice único de `reactions`
  // é o que impede reação duplicada, então precisa existir de fato no banco.
  await mongoose.syncIndexes();
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
