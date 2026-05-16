import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import connectDB from "../../../../lib/db";
import { normalizeTags, serializeVideo } from "../../../../lib/dashboard-data";
import User from "../../../../models/User";
import Video from "../../../../models/Video";

const ALLOWED_STATUS = ["draft", "queued", "uploading", "processing", "live", "failed"];
const ALLOWED_VISIBILITY = ["public", "unlisted", "private"];
const ALLOWED_LICENSES = ["Standard", "Creative Commons"];

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    await connectDB();

    const video = await Video.findOne({ _id: id, userId: session.user.id });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (typeof body.title === "string" && body.title.trim()) {
      video.title = body.title.trim();
    }

    if (body.desc !== undefined || body.description !== undefined) {
      video.description = String(body.desc ?? body.description ?? "").trim();
    }

    if (body.tags !== undefined) {
      video.tags = normalizeTags(body.tags);
    }

    if (body.status && ALLOWED_STATUS.includes(body.status)) {
      video.status = body.status;
    }

    if (body.visibility && ALLOWED_VISIBILITY.includes(body.visibility)) {
      video.visibility = body.visibility;
    }

    if (typeof body.category === "string" && body.category.trim()) {
      video.category = body.category.trim();
    }

    if (typeof body.language === "string" && body.language.trim()) {
      video.language = body.language.trim();
    }

    if (body.comments !== undefined || body.allowComments !== undefined) {
      video.allowComments = Boolean(body.comments ?? body.allowComments);
    }

    if (body.ageRestricted !== undefined) {
      video.ageRestricted = Boolean(body.ageRestricted);
    }

    if (body.license && ALLOWED_LICENSES.includes(body.license)) {
      video.license = body.license;
    }

    if (body.thumbUrl !== undefined || body.thumbnailUrl !== undefined) {
      video.thumbnailUrl = String(body.thumbUrl ?? body.thumbnailUrl ?? "").trim();
    }

    if (body.dur !== undefined || body.duration !== undefined) {
      video.duration = String(body.dur ?? body.duration ?? "0:00").trim() || "0:00";
    }

    if (body.platforms && typeof body.platforms === "object") {
      video.platforms = body.platforms;
    }

    await video.save();

    return NextResponse.json({ video: serializeVideo(video) });
  } catch (error) {
    console.error("Update video error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_request, context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    await connectDB();

    const video = await Video.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    await User.findByIdAndUpdate(session.user.id, { $inc: { videosUploaded: -1 } });

    return NextResponse.json({ message: "Video deleted" });
  } catch (error) {
    console.error("Delete video error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
