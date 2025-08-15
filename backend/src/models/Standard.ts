import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStandard extends Document {
  code: string;
  description: string;
  gradeId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StandardSchema = new Schema<IStandard>({
  code: { type: String, required: true },
  description: { type: String },
  gradeId: { type: Schema.Types.ObjectId, ref: "Grade", required: true },
}, { timestamps: true });

export default mongoose.models.Standard || mongoose.model<IStandard>("Standard", StandardSchema);
