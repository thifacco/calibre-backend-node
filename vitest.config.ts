import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
    // Ambiente mínimo para os testes importarem config/env.js sem um .env real.
    // Nenhum teste deve tocar o Atlas — repositories entram mockados.
    env: {
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://localhost:27017/calibre-test",
      JWT_SECRET: "segredo-de-teste-nao-usar-em-producao",
    },
  },
});
