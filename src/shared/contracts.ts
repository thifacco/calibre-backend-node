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

export interface NewCollectionItemInput {
  brand: string;
  model: string;
  referenceNumber?: string;
  movementType?: MovementType;
  acquiredYear?: number;
  acquiredContext?: string;
  memoryStory: string;
  photos?: string[];
}
