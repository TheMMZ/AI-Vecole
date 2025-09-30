import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  profilePic?: string | null;
  role: "teacher" | "admin";
  suspended?: boolean;
  suspendedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  profilePic: { type: String, default: null },
  role: { type: String, enum: ["teacher", "admin"], default: "teacher" },
  suspended: { type: Boolean, default: false },
  suspendedUntil: { type: Date, default: null },
}, { timestamps: true });

// Ensure unique index exists at the MongoDB level as well
UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);