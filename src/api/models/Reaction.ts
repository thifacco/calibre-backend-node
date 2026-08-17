import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const REACTION_TYPES = ["TOUCHED", "CURIOUS", "SAME_STORY"] as const;

const reactionSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "CollectionItem", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: REACTION_TYPES, required: true },
    createdAt: { type: Date, default: () => new Date(), immutable: true },
  },
  { versionKey: false },
);

// É este índice que impede reação duplicada — a garantia é do banco,
// não da aplicação. Não remover confiando na checagem do service.
reactionSchema.index({ itemId: 1, userId: 1, type: 1 }, { unique: true });

export type ReactionDoc = InferSchemaType<typeof reactionSchema> & { _id: Types.ObjectId };

export const ReactionModel = model("Reaction", reactionSchema, "reactions");
