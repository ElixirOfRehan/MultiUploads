import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import connectDB from "../../../../lib/db";
import User from "../../../../models/User";
import { evaluatePassword } from "../../../../lib/password";
import { sendVerificationEmail } from "../../../../lib/email";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const strength = evaluatePassword(password, [name, email]);
    if (!strength.ok) {
      return NextResponse.json(
        {
          error: strength.warning || "Password is too weak. Please choose a stronger password.",
          score: strength.score,
          label: strength.label,
          suggestions: strength.suggestions,
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token (24h expiry)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      provider: "credentials",
      plan: "free",
      role: "user",
      verificationToken,
      verificationTokenExpiresAt,
      verificationLastSentAt: new Date(),
    });

    // Send verification email. If this fails we delete the user so they can
    // try again with the same email (no silent failure per project rules).
    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL;
    if (!appUrl) {
      await User.deleteOne({ _id: user._id });
      return NextResponse.json(
        { error: "Server misconfigured: APP_URL is not set" },
        { status: 500 }
      );
    }
    const verifyUrl = `${appUrl}/api/auth/verify?token=${verificationToken}`;

    try {
      await sendVerificationEmail({ to: user.email, name: user.name, url: verifyUrl });
    } catch (emailError) {
      console.error("Verification email failed, rolling back signup:", emailError);
      await User.deleteOne({ _id: user._id });
      return NextResponse.json(
        {
          error:
            "We could not send your verification email. Please check the address and try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        message:
          "Account created. Check your inbox for a verification link to activate your account.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          plan: user.plan,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
