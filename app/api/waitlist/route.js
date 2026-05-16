import { NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import WaitlistEntry from "../../../models/WaitlistEntry";

export async function GET() {
  try {
    await connectDB();
    const count = await WaitlistEntry.countDocuments();

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Waitlist count error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    await connectDB();

    const existingEntry = await WaitlistEntry.findOne({ email: normalizedEmail }).lean();
    if (existingEntry) {
      return NextResponse.json({
        created: false,
        message: "You are already on the waitlist.",
      });
    }

    await WaitlistEntry.create({
      email: normalizedEmail,
      metadata: {
        userAgent: request.headers.get("user-agent") || "",
        referer: request.headers.get("referer") || "",
      },
    });

    return NextResponse.json({
      created: true,
      message: "You are on the waitlist.",
    }, { status: 201 });
  } catch (error) {
    console.error("Waitlist submit error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
