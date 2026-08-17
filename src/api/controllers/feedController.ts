import type { RequestHandler } from "express";
import { z } from "zod";
import * as feedService from "../services/feedService.js";

const feedQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  q: z.string().max(100).optional(),
});

/** GET /api/feed?cursor=&q= — público, paginado por cursor. */
export const list: RequestHandler = async (req, res) => {
  const query = feedQuerySchema.parse(req.query);
  const feed = await feedService.getFeed(query);

  res.status(200).json(feed);
};
