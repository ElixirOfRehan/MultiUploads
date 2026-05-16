import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import Video from "../../../../models/Video";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const [users, videos, totalVideos] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).lean(),
      Video.find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("userId", "name email")
        .lean(),
      Video.countDocuments(),
    ]);

    // Active today: users who logged in within last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeToday = await User.countDocuments({ lastLogin: { $gte: oneDayAgo } });

    const proUsers = await User.countDocuments({ plan: { $in: ["pro", "growth"] } });

    return NextResponse.json({
      users,
      videos,
      stats: {
        totalUsers: users.length,
        totalVideos,
        activeToday,
        proUsers,
      },
    });
  } catch (error) {
    console.error("Admin data error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
