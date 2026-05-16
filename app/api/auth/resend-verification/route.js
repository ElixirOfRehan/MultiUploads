import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { sendVerificationEmail } from "../../../../lib/email";

const RESEND_THROTTLE_MS = 60 * 1000; // 60 seconds

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select(
      "+verificationToken +verificationTokenExpiresAt +verificationLastSentAt"
    );

    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 409 }
      );
    }

    if (user.provider !== "credentials") {
      return NextResponse.json(
        { error: "This account does not require email verification" },
        { status: 400 }
      );
    }

    const now = Date.now();
    if (
      user.verificationLastSentAt &&
      now - new Date(user.verificationLastSentAt).getTime() < RESEND_THROTTLE_MS
    ) {
      const waitSec = Math.ceil(
        (RESEND_THROTTLE_MS -
          (now - new Date(user.verificationLastSentAt).getTime())) /
          1000
      );
      return NextResponse.json(
        { error: `Please wait ${waitSec}s before requesting another email` },
        { status: 429 }
      );
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = new Date(now + 24 * 60 * 60 * 1000);
    user.verificationLastSentAt = new Date(now);
    await user.save();

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "Server misconfigured: APP_URL is not set" },
        { status: 500 }
      );
    }
    const verifyUrl = `${appUrl}/api/auth/verify?token=${verificationToken}`;

    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      url: verifyUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Could not send verification email. Try again shortly." },
      { status: 502 }
    );
  }
}
