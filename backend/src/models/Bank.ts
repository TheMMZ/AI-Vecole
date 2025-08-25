import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBank extends Document {
  title: string;
  description?: string;
  createdBy?: Types.ObjectId;
  teacherId?: Types.ObjectId;
  gradeIds?: Types.ObjectId[];
  standardIds?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const BankSchema = new Schema<IBank>({
  title: { type: String, required: true },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  teacherId: { type: Schema.Types.ObjectId, ref: "User" },
  gradeIds: [{ type: Schema.Types.ObjectId, ref: "Grade" }],
  standardIds: [{ type: Schema.Types.ObjectId, ref: "Standard" }],
}, { timestamps: true });

export default mongoose.models.Bank || mongoose.model<IBank>("Bank", BankSchema);
