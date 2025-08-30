import mongoose, { Schema, Document } from "mongoose";

export interface IStandard extends Document {
  code: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const StandardSchema = new Schema<IStandard>({
  code: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

export default mongoose.models.Standard || mongoose.model<IStandard>("Standard", StandardSchema);
