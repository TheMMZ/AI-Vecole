import mongoose, { Schema, Document, Types } from "mongoose";

export interface IItem extends Document {
  bankId: Types.ObjectId;
  contentId: Types.ObjectId;
  type: "MCQ" | "TrueFalse";
  question: string;
  options: string[];
  answer: string;
  metadata: {
    difficulty?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>({
  bankId: { type: Schema.Types.ObjectId, ref: "Bank", required: true },
  contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true },
  type: { type: String, enum: ["MCQ", "TrueFalse"], required: true },
  question: { type: String, required: true },
  options: [{ type: String }],
  answer: { type: String, required: true },
  metadata: {
    difficulty: { type: String },
    tags: [{ type: String }],
  },
}, { timestamps: true });

export default mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);
