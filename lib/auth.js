import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from "./db";
import User from "../models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        // Find user and explicitly include password field
        const user = await User.findOne({ email: credentials.email }).select("+password");

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (!user.password) {
          throw new Error("This account uses Google sign-in. Please use the Google button.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Incorrect password");
        }

        // Update last login
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          plan: user.plan,
          role: user.role,
        };
      },
    }),

    // Google OAuth — only enabled if credentials are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Create new user from Google OAuth
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image || "",
            provider: "google",
            plan: "free",
            role: "user",
          });
        } else {
          // Update last login and image
          await User.findByIdAndUpdate(existingUser._id, {
            lastLogin: new Date(),
            image: user.image || existingUser.image,
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
        token.role = user.role;
      }

      // Refresh user data from DB on each token refresh (e.g., plan changes)
      if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.plan = dbUser.plan;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.image = dbUser.image;
          token.emailVerified = !!dbUser.emailVerified;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.plan = token.plan;
        session.user.role = token.role;
        session.user.image = token.image;
        session.user.emailVerified = !!token.emailVerified;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
