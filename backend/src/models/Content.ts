import mongoose, { Schema, Document, Types } from "mongoose";

export interface IContent extends Document {
  title: string;
  fileUrl: string;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.models.Content || mongoose.model<IContent>("Content", ContentSchema);
