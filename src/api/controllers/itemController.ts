import type { RequestHandler } from "express";
import { z } from "zod";
import * as itemService from "../services/itemService.js";
import { getUserId } from "../../middleware/auth.js";
import type { UserItemsResponse } from "../../shared/contracts.js";

const ANO_MINIMO = 1800;

const newItemSchema = z.object({
  brand: z.string().trim().min(1, "Marca é obrigatória").max(120),
  model: z.string().trim().min(1, "Modelo é obrigatório").max(120),
  referenceNumber: z.string().trim().max(120).optional(),
  movementType: z
    .enum(["MANUAL", "AUTOMATIC", "QUARTZ", "ECO_DRIVE", "SPRING_DRIVE", "OTHER"])
    .optional(),
  acquiredYear: z
    .number()
    .int()
    .min(ANO_MINIMO)
    .max(new Date().getFullYear())
    .optional(),
  acquiredContext: z.string().trim().max(2000).optional(),
  memoryStory: z.string().trim().min(1, "A história da memória é obrigatória").max(10000),
  photos: z.array(z.url("Foto precisa ser uma URL")).max(10).optional(),
});

const listQuerySchema = z.object({
  userId: z.string().min(1, "userId é obrigatório"),
});

/** POST /api/items — cria item do usuário autenticado. */
export const create: RequestHandler = async (req, res) => {
  const input = newItemSchema.parse(req.body);
  const item = await itemService.createItem(getUserId(req), input);

  res.status(201).json(item);
};

/** GET /api/items?userId= — itens de um usuário (dashboard). */
export const listByUser: RequestHandler = async (req, res) => {
  const { userId } = listQuerySchema.parse(req.query);
  const items = await itemService.listByUser(userId);

  const body: UserItemsResponse = { items };
  res.status(200).json(body);
};
