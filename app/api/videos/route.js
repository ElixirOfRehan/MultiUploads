import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import connectDB from "../../../lib/db";
import { buildPlatformPayload, normalizeTags, serializeConnectedAccounts, serializeVideo } from "../../../lib/dashboard-data";
import User from "../../../models/User";
import Video from "../../../models/Video";

const ALLOWED_PLATFORMS = ["youtube", "instagram", "tiktok", "facebook", "x", "linkedin"];
const ALLOWED_VISIBILITY = ["public", "unlisted", "private"];
const ALLOWED_LICENSES = ["Standard", "Creative Commons"];

function normalizePlatformSelection(value) {
  if (!Array.isArray(value)) return [];

  return [...new Set(value.filter((platform) => ALLOWED_PLATFORMS.includes(platform)))];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const [user, videos] = await Promise.all([
      User.findById(session.user.id).lean(),
      Video.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      videos: videos.map(serializeVideo),
      connectedAccounts: serializeConnectedAccounts(user),
    });
  } catch (error) {
    console.error("Videos fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const title = body.title?.trim();
    const description = (body.description ?? body.desc ?? "").trim();
    const tags = normalizeTags(body.tags);
    const selectedPlatforms = normalizePlatformSelection(body.selectedPlatforms);

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (selectedPlatforms.length === 0) {
      return NextResponse.json({ error: "Select at least one connected platform" }, { status: 400 });
    }

    const visibility = ALLOWED_VISIBILITY.includes(body.visibility) ? body.visibility : "public";
    const license = ALLOWED_LICENSES.includes(body.license) ? body.license : "Standard";

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const disconnectedPlatforms = selectedPlatforms.filter(
      (platform) => !user.connectedPlatforms?.[platform]?.connected
    );

    if (disconnectedPlatforms.length > 0) {
      return NextResponse.json(
        { error: `Connect ${disconnectedPlatforms.join(", ")} before distributing.` },
        { status: 400 }
      );
    }

    const video = await Video.create({
      userId: user._id,
      title,
      description,
      tags,
      status: "queued",
      visibility,
      category: body.category?.trim() || "Education",
      language: body.language?.trim() || "English",
      fileUrl: body.fileUrl?.trim() || "",
      fileName: body.fileName?.trim() || "",
      fileSize: Number(body.fileSize) || 0,
      thumbnailUrl: body.thumbnailUrl?.trim() || "",
      duration: body.duration?.trim() || "0:00",
      platforms: buildPlatformPayload(selectedPlatforms, {
        title,
        description,
        tags,
        visibility,
      }),
      allowComments: body.allowComments ?? body.comments ?? true,
      ageRestricted: Boolean(body.ageRestricted),
      license,
    });

    await User.findByIdAndUpdate(user._id, { $inc: { videosUploaded: 1 } });

    return NextResponse.json({ video: serializeVideo(video) }, { status: 201 });
  } catch (error) {
    console.error("Create video error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
