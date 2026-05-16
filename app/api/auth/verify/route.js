import { NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";

function redirect(path) {
  const base = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3001";
  return NextResponse.redirect(`${base}${path}`);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token || typeof token !== "string" || token.length !== 64) {
    return redirect("/login?verifyError=invalid");
  }

  try {
    await connectDB();

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiresAt: { $gt: new Date() },
    }).select(
      "+verificationToken +verificationTokenExpiresAt +verificationLastSentAt"
    );

    if (!user) {
      return redirect("/login?verifyError=invalid");
    }

    user.emailVerified = new Date();
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    user.verificationLastSentAt = null;
    await user.save();

    return redirect("/login?verified=1");
  } catch (error) {
    console.error("Email verification error:", error);
    return redirect("/login?verifyError=server");
  }
}
