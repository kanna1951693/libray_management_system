import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { z } from "zod";

const postSchema = z.object({
  bookId: z.string().min(1),
  copyId: z.string().optional(),
});

const deleteSchema = z.object({
  holdId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireMember();
  if (!session) return response!;

  try {
    const body = await req.json();
    const { bookId, copyId } = postSchema.parse(body);
    const memberId = session.user.id;

    if (copyId) {
      const copy = await prisma.bookCopy.findUnique({ where: { id: copyId } });
      if (!copy || copy.bookId !== bookId) {
        return NextResponse.json({ error: "Invalid copy" }, { status: 400 });
      }
      if (copy.status !== "AVAILABLE") {
        return NextResponse.json({ error: "Copy is not available" }, { status: 409 });
      }
      const existing = await prisma.hold.findUnique({
        where: { memberId_copyId: { memberId, copyId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Hold already placed on this copy" }, { status: 409 });
      }
    }

    const position = (await prisma.hold.count({ where: { bookId, status: "WAITING" } })) + 1;

    const hold = await prisma.$transaction(async (tx) => {
      const newHold = await tx.hold.create({
        data: { memberId, bookId, copyId: copyId ?? null, position },
      });
      if (copyId) {
        await tx.bookCopy.update({ where: { id: copyId }, data: { status: "ON_HOLD" } });
      }
      return newHold;
    });

    return NextResponse.json(hold, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const { session, response } = await requireMember();
  if (!session) return response!;

  const holds = await prisma.hold.findMany({
    where:   { memberId: session.user.id },
    include: { book: true, copy: true },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json(holds);
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireMember();
  if (!session) return response!;

  try {
    const body = await req.json();
    const { holdId } = deleteSchema.parse(body);
    await prisma.hold.deleteMany({ where: { id: holdId, memberId: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
