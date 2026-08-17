import "dotenv/config";
import { z } from "zod";

/**
 * Valida o ambiente no boot. Um .env incompleto derruba o processo aqui,
 * com a lista do que falta, em vez de estourar numa rota qualquer depois.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI é obrigatória"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET precisa ter ao menos 16 caracteres"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problemas = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  console.error(`Configuração de ambiente inválida:\n${problemas}\n\nVeja .env.example.`);
  process.exit(1);
}

export const env = parsed.data;
