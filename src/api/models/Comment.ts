import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const commentSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "CollectionItem", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true }, // desnormalizado
    content: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date(), immutable: true },
  },
  { versionKey: false },
);

export type CommentDoc = InferSchemaType<typeof commentSchema> & { _id: Types.ObjectId };

export const CommentModel = model("Comment", commentSchema, "comments");
