import mongoose from "mongoose";

interface IActivity {
  action: string;
  actor?: string; // optional user id or username
  date?: Date;
  icon?: string;
}

const ActivitySchema = new mongoose.Schema<IActivity>({
  action: { type: String, required: true },
  actor: String,
  date: { type: Date, default: () => new Date() },
  icon: String,
});

export default mongoose.models.Activity || mongoose.model("Activity", ActivitySchema);
