import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      // Not required because Google OAuth users won't have a password
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default in queries
    },
    image: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    plan: {
      type: String,
      enum: ["free", "lite", "growth", "pro"],
      default: "free",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    connectedPlatforms: {
      youtube: { connected: { type: Boolean, default: false }, accountName: String, lastSync: Date },
      instagram: { connected: { type: Boolean, default: false }, accountName: String, lastSync: Date },
      tiktok: { connected: { type: Boolean, default: false }, accountName: String, lastSync: Date },
      facebook: { connected: { type: Boolean, default: false }, accountName: String, lastSync: Date },
      x: { connected: { type: Boolean, default: false }, accountName: String, lastSync: Date },
      linkedin: { connected: { type: Boolean, default: false }, accountName: String, lastSync: Date },
    },
    videosUploaded: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    verificationToken: {
      type: String,
      default: null,
      select: false,
    },
    verificationTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    verificationLastSentAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Prevent re-compilation in dev mode
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
