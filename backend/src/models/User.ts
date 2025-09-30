import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: "teacher" | "admin";
  suspended?: boolean;
  suspendedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["teacher", "admin"], default: "teacher" },
  suspended: { type: Boolean, default: false },
  suspendedUntil: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);