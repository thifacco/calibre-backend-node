declare global {
  namespace Express {
    interface Request {
      /** Preenchido pelo middleware requireAuth. Ausente em rotas públicas. */
      auth?: { userId: string };
    }
  }
}

export {};
