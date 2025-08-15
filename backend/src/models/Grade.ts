import mongoose, { Schema, Document } from "mongoose";

export interface IGrade extends Document {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const GradeSchema = new Schema<IGrade>({
  name: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

export default mongoose.models.Grade || mongoose.model<IGrade>("Grade", GradeSchema);
