import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const MOVEMENT_TYPES = [
  "MANUAL",
  "AUTOMATIC",
  "QUARTZ",
  "ECO_DRIVE",
  "SPRING_DRIVE",
  "OTHER",
] as const;

const collectionItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Cópia de users.name. Existe para o feed renderizar sem join — ver ARQUITETURA.md.
    userName: { type: String, required: true },

    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    referenceNumber: { type: String, trim: true },
    movementType: { type: String, enum: MOVEMENT_TYPES },
    acquiredYear: { type: Number },
    acquiredContext: { type: String },
    memoryStory: { type: String, required: true },

    // URLs embutidas — sem coleção separada.
    photos: { type: [String], default: [] },

    // Contadores desnormalizados. Só mudam junto com o detalhe correspondente,
    // na mesma transação (ver reactionRepository e commentRepository).
    reactionCounts: {
      touched: { type: Number, default: 0 },
      curious: { type: Number, default: 0 },
      sameStory: { type: Number, default: 0 },
    },
    commentCount: { type: Number, default: 0 },

    createdAt: { type: Date, default: () => new Date(), immutable: true },
  },
  { versionKey: false },
);

// Feed paginado por cursor: ordena por createdAt desc com _id como desempate,
// então o índice precisa cobrir os dois campos.
collectionItemSchema.index({ createdAt: -1, _id: -1 });

export type CollectionItemDoc = InferSchemaType<typeof collectionItemSchema> & {
  _id: Types.ObjectId;
};

export const CollectionItemModel = model("CollectionItem", collectionItemSchema, "collectionItems");
