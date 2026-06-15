import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const patchSchema = z.object({
  memberId: z.string().min(1),
  status:   z.enum(["ACTIVE", "PENDING", "EXPIRED", "SUSPENDED"]),
});

export async function GET() {
  const { session, response } = await requireAdmin();
  if (!session) return response!;

  const members = await prisma.member.findMany({
    where:   { role: "MEMBER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, studentId: true,
      department: true, membershipId: true, status: true,
      joinedAt: true, expiresAt: true,
    },
  });

  return NextResponse.json(members);
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (!session) return response!;

  try {
    const body = await req.json();
    const { memberId, status } = patchSchema.parse(body);

    const updated = await prisma.member.update({
      where: { id: memberId },
      data:  { status },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
