import mongoose from "mongoose";

const PlatformStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["queued", "processing", "live", "failed"],
      default: "queued",
    },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    title: { type: String, default: "" },
    desc: { type: String, default: "" },
    tags: [String],
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "public",
    },
    publishedAt: Date,
    platformVideoId: String, // ID from the platform (e.g. YouTube video ID)
    errorMessage: String,
  },
  { _id: false }
);

const VideoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    tags: [String],
    status: {
      type: String,
      enum: ["draft", "queued", "uploading", "processing", "live", "failed"],
      default: "draft",
    },
    visibility: {
      type: String,
      enum: ["public", "unlisted", "private"],
      default: "public",
    },
    category: {
      type: String,
      default: "Education",
    },
    language: {
      type: String,
      default: "English",
    },
    // File info
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 }, // in bytes
    thumbnailUrl: { type: String, default: "" },
    duration: { type: String, default: "0:00" }, // formatted duration

    // Platform-specific data
    platforms: {
      youtube: PlatformStatusSchema,
      instagram: PlatformStatusSchema,
      tiktok: PlatformStatusSchema,
      facebook: PlatformStatusSchema,
      x: PlatformStatusSchema,
      linkedin: PlatformStatusSchema,
    },

    // Settings
    allowComments: { type: Boolean, default: true },
    ageRestricted: { type: Boolean, default: false },
    license: {
      type: String,
      enum: ["Standard", "Creative Commons"],
      default: "Standard",
    },
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.models.Video || mongoose.model("Video", VideoSchema);

export default Video;
