/**
 * Erro esperado de negócio, lançado pelos services e traduzido em resposta
 * HTTP pelo errorHandler. Qualquer outro erro que chegue lá vira 500.
 */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string) => new AppError(400, message);
export const unauthorized = (message = "Não autenticado") => new AppError(401, message);
export const forbidden = (message = "Sem permissão") => new AppError(403, message);
export const notFound = (message = "Recurso não encontrado") => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);
