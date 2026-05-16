import mongoose from "mongoose";

const WaitlistEntrySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    status: {
      type: String,
      enum: ["pending", "invited", "converted"],
      default: "pending",
    },
    source: {
      type: String,
      default: "landing-page",
    },
    metadata: {
      userAgent: { type: String, default: "" },
      referer: { type: String, default: "" },
    },
    invitedAt: Date,
    convertedAt: Date,
  },
  {
    timestamps: true,
  }
);

const WaitlistEntry = mongoose.models.WaitlistEntry || mongoose.model("WaitlistEntry", WaitlistEntrySchema);

export default WaitlistEntry;
