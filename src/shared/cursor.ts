import { Types } from "mongoose";

/**
 * Cursor opaco do feed. Carrega createdAt + _id porque createdAt sozinho não
 * é único: dois itens criados no mesmo milissegundo fariam a paginação pular
 * ou repetir registros. O _id entra como desempate.
 *
 * O formato é detalhe interno — o front só devolve a string que recebeu.
 */
export interface FeedCursor {
  createdAt: Date;
  id: Types.ObjectId;
}

export function encodeCursor(createdAt: Date, id: Types.ObjectId): string {
  return Buffer.from(`${createdAt.toISOString()}|${id.toString()}`, "utf8").toString("base64url");
}

export function decodeCursor(raw: string): FeedCursor | null {
  let decoded: string;

  try {
    decoded = Buffer.from(raw, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const separator = decoded.lastIndexOf("|");
  if (separator === -1) return null;

  const iso = decoded.slice(0, separator);
  const id = decoded.slice(separator + 1);

  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime())) return null;
  if (!Types.ObjectId.isValid(id)) return null;

  return { createdAt, id: new Types.ObjectId(id) };
}
