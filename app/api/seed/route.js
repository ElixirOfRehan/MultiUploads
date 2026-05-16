import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../../../lib/db";
import User from "../../../models/User";
import Video from "../../../models/Video";

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed is disabled in production" }, { status: 403 });
  }

  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Video.deleteMany({});

    // Create test admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await User.create({
      name: "Admin",
      email: "admin@multiuploads.com",
      password: adminPassword,
      provider: "credentials",
      plan: "pro",
      role: "admin",
      connectedPlatforms: {
        youtube: { connected: true, accountName: "MultiUploads Official", lastSync: new Date() },
        instagram: { connected: true, accountName: "@multiuploads", lastSync: new Date() },
      },
    });

    // Create test regular user
    const userPassword = await bcrypt.hash("password123", 12);
    const testUser = await User.create({
      name: "Rehan",
      email: "test@multiuploads.com",
      password: userPassword,
      provider: "credentials",
      plan: "free",
      role: "user",
      connectedPlatforms: {
        youtube: { connected: true, accountName: "Rehan Creates", lastSync: new Date() },
        instagram: { connected: true, accountName: "@rehancreates", lastSync: new Date() },
        tiktok: { connected: true, accountName: "@rehancreates", lastSync: new Date() },
        facebook: { connected: true, accountName: "Rehan Creates", lastSync: new Date() },
      },
      videosUploaded: 6,
    });

    // Create a few more test users
    const users = [];
    const names = ["Arjun M.", "Priya S.", "Rohan K.", "Sneha R.", "Vivek P."];
    const plans = ["free", "lite", "growth", "free", "pro"];

    for (let i = 0; i < 5; i++) {
      const pw = await bcrypt.hash("password123", 12);
      const u = await User.create({
        name: names[i],
        email: `user${i + 1}@test.com`,
        password: pw,
        provider: "credentials",
        plan: plans[i],
        role: "user",
        videosUploaded: Math.floor(Math.random() * 10),
      });
      users.push(u);
    }

    // Create sample videos for test user
    const sampleVideos = [
      {
        userId: testUser._id,
        title: "How I Built My Morning Routine in 30 Days",
        description: "In this video I share my complete morning routine transformation over 30 days.",
        tags: ["morning routine", "productivity", "self improvement"],
        status: "live",
        duration: "12:34",
        category: "Education",
        platforms: {
          youtube: { status: "live", views: 4520, likes: 312, title: "How I Built My Morning Routine in 30 Days", tags: ["morning routine", "productivity"], visibility: "public" },
          instagram: { status: "live", views: 8930, likes: 1024, title: "Morning Routine Transformation 🌅", tags: ["morningroutine", "discipline"], visibility: "public" },
          tiktok: { status: "live", views: 15200, likes: 2100, title: "POV: You actually wake up at 5AM for 30 days", tags: ["morningroutine", "5amclub"], visibility: "public" },
        },
      },
      {
        userId: testUser._id,
        title: "5 Editing Tricks Every Creator Should Know",
        description: "Master these 5 video editing techniques that will instantly improve your content quality.",
        tags: ["editing", "video editing", "creator tips"],
        status: "live",
        duration: "8:21",
        category: "Education",
        platforms: {
          youtube: { status: "live", views: 2100, likes: 189, title: "5 Editing Tricks Every Creator Should Know", tags: ["editing", "tips"], visibility: "public" },
          instagram: { status: "processing", views: 0, likes: 0, title: "5 Editing Tricks 🎬", tags: ["editingtips"], visibility: "public" },
        },
      },
      {
        userId: testUser._id,
        title: "Behind the Scenes - Studio Setup Tour",
        description: "Full tour of my home studio setup including camera, lighting, and audio.",
        tags: ["studio tour", "setup", "behind the scenes"],
        status: "live",
        duration: "15:47",
        category: "Science & Technology",
        platforms: {
          youtube: { status: "live", views: 6780, likes: 520, title: "Studio Setup Tour", tags: ["studio", "setup"], visibility: "public" },
          tiktok: { status: "live", views: 22400, likes: 3800, title: "My ₹50K Studio Setup 🔥", tags: ["studiotour"], visibility: "public" },
        },
      },
      {
        userId: testUser._id,
        title: "Why Most Creators Fail (And How to Fix It)",
        description: "The real reasons why 95% of creators quit within the first year.",
        tags: ["creator", "motivation", "growth"],
        status: "processing",
        duration: "10:15",
        category: "Education",
        platforms: {
          youtube: { status: "processing", views: 0, likes: 0, title: "Why Most Creators Fail", tags: [], visibility: "public" },
          instagram: { status: "queued", views: 0, likes: 0, title: "", tags: [], visibility: "public" },
        },
      },
      {
        userId: testUser._id,
        title: "Day in My Life as a Content Creator",
        description: "A typical day creating content — from ideation to publishing.",
        tags: ["day in my life", "content creator", "vlog"],
        status: "live",
        duration: "6:42",
        category: "Entertainment",
        platforms: {
          youtube: { status: "live", views: 9300, likes: 710, title: "Day in My Life as a Content Creator", tags: ["ditl", "vlog"], visibility: "public" },
          instagram: { status: "live", views: 12500, likes: 1890, title: "Creator Life 🎬", tags: ["creatorlife"], visibility: "public" },
          tiktok: { status: "live", views: 31000, likes: 5200, title: "POV: Content creator life", tags: ["creatorlife"], visibility: "public" },
          facebook: { status: "live", views: 1200, likes: 89, title: "Day in My Life", tags: [], visibility: "public" },
        },
      },
    ];

    await Video.insertMany(sampleVideos);

    return NextResponse.json({
      message: "✅ Database seeded successfully!",
      data: {
        users: 7,
        videos: 5,
        admin: { email: "admin@multiuploads.com", password: "admin123" },
        testUser: { email: "test@multiuploads.com", password: "password123" },
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
