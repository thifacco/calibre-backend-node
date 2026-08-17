import type { RequestHandler } from "express";
import { z } from "zod";
import * as reactionService from "../services/reactionService.js";
import { getUserId } from "../../middleware/auth.js";
import type { ReactionResponse } from "../../shared/contracts.js";

const reactionSchema = z.object({
  type: z.enum(["TOUCHED", "CURIOUS", "SAME_STORY"], {
    message: "Tipo de reação inválido",
  }),
});

const paramsSchema = z.object({ id: z.string().min(1) });

/** POST /api/items/:id/reactions — 409 se já existir a mesma reação. */
export const create: RequestHandler = async (req, res) => {
  const { id } = paramsSchema.parse(req.params);
  const { type } = reactionSchema.parse(req.body);

  const reactionCounts = await reactionService.react(id, getUserId(req), type);

  const body: ReactionResponse = { reactionCounts };
  res.status(201).json(body);
};
