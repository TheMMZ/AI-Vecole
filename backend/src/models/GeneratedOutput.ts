import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGeneratedOutput extends Document {
  bankId?: Types.ObjectId;
  contentId?: Types.ObjectId;
  raw: string;
  createdAt: Date;
}

const GeneratedOutputSchema = new Schema<IGeneratedOutput>({
  bankId: { type: Schema.Types.ObjectId, ref: "Bank" },
  contentId: { type: Schema.Types.ObjectId, ref: "Content" },
  raw: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.models.GeneratedOutput || mongoose.model<IGeneratedOutput>("GeneratedOutput", GeneratedOutputSchema);
