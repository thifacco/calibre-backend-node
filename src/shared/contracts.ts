/**
 * Tipos do contrato com o front-end. Alterar qualquer coisa aqui é breaking
 * change — sincronizar com o repositório de front-end antes. Ver ARQUITETURA.md.
 */

export type ReactionType = "TOUCHED" | "CURIOUS" | "SAME_STORY";

export type MovementType =
  | "MANUAL"
  | "AUTOMATIC"
  | "QUARTZ"
  | "ECO_DRIVE"
  | "SPRING_DRIVE"
  | "OTHER";

export interface ReactionCounts {
  touched: number;
  curious: number;
  sameStory: number;
}

export interface FeedItem {
  id: string;
  userId: string;
  userName: string; // desnormalizado — o front não faz join
  brand: string;
  model: string;
  referenceNumber?: string;
  movementType?: MovementType;
  acquiredYear?: number;
  acquiredContext?: string;
  memoryStory: string;
  photos: string[];
  reactionCounts: ReactionCounts;
  commentCount: number;
  createdAt: string;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
}

export interface SessionResponse {
  token: string;
  userId: string;
  name: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CommentResponse {
  id: string;
  itemId: string;
  userId: string;
  userName: string; // desnormalizado
  content: string;
  createdAt: string;
}

/** Resposta de POST /api/items/:id/reactions — contadores já atualizados. */
export interface ReactionResponse {
  reactionCounts: ReactionCounts;
}

/** Resposta de GET /api/items?userId= */
export interface UserItemsResponse {
  items: FeedItem[];
}

/**
 * Payload de POST /api/items. Diferente dos tipos de resposta, os opcionais
 * aceitam `undefined` explícito: é o que o zod produz ao parsear um corpo em
 * que a chave veio ausente. Nas respostas o campo é omitido, nunca undefined.
 */
export interface NewCollectionItemInput {
  brand: string;
  model: string;
  referenceNumber?: string | undefined;
  movementType?: MovementType | undefined;
  acquiredYear?: number | undefined;
  acquiredContext?: string | undefined;
  memoryStory: string;
  photos?: string[] | undefined;
}
