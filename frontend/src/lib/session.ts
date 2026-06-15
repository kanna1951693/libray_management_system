import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// ─── Typed session user ───────────────────────────────────────────────────────
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER" | "LIBRARIAN";
  membershipId: string;
};

// ─── Get typed session ────────────────────────────────────────────────────────
export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    ...session,
    user: session.user as SessionUser,
  };
}

// ─── Require authenticated member ─────────────────────────────────────────────
export async function requireMember() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MEMBER") {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorised" }, { status: 401 }),
    };
  }
  return { session, response: null };
}

// ─── Require admin role ───────────────────────────────────────────────────────
export async function requireAdmin() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, response: null };
}

// ─── Require staff role (ADMIN or LIBRARIAN) ──────────────────────────────────
export async function requireStaff() {
  const session = await getAuthSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LIBRARIAN")) {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, response: null };
}

// ─── Require librarian role only ──────────────────────────────────────────────
export async function requireLibrarian() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "LIBRARIAN") {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden — only librarians can issue books" }, { status: 403 }),
    };
  }
  return { session, response: null };
}
