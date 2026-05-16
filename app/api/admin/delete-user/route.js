import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import Video from "../../../../models/Video";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await connectDB();

    // Don't allow deleting admin users
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role === "admin") {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
    }

    // Delete user's videos first
    await Video.deleteMany({ userId });
    // Delete user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "User and their videos deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
