import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn:  "/login",
    signOut: "/",
    error:   "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const member = await prisma.member.findUnique({
          where: { email: credentials.email },
        });

        if (!member) return null;

        if (member.status === "PENDING")   throw new Error("Your membership is pending admin approval.");
        if (member.status === "SUSPENDED") throw new Error("Your account has been suspended.");
        if (member.status === "EXPIRED")   throw new Error("Your membership has expired. Please renew.");

        // Support legacy SHA-256 hashes and new bcrypt hashes transparently
        let passwordMatch = false;
        if (member.passwordHash.startsWith("$2")) {
          // New bcrypt hash
          passwordMatch = await bcrypt.compare(credentials.password, member.passwordHash);
        } else {
          // Legacy SHA-256 — verify, then silently upgrade to bcrypt
          const { createHash } = await import("crypto");
          const sha256 = createHash("sha256").update(credentials.password).digest("hex");
          if (sha256 === member.passwordHash) {
            passwordMatch = true;
            const newHash = await bcrypt.hash(credentials.password, 12);
            await prisma.member.update({ where: { id: member.id }, data: { passwordHash: newHash } });
          }
        }

        if (!passwordMatch) return null;

        return {
          id:           member.id,
          email:        member.email,
          name:         member.name,
          membershipId: member.membershipId,
          role:         member.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id           = user.id;
        token.membershipId = (user as any).membershipId;
        token.role         = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id           = token.id;
        (session.user as any).membershipId = token.membershipId;
        (session.user as any).role         = token.role;
      }
      return session;
    },
  },
};
