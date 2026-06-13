import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { bookId, copyId } = await req.json();
  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  const memberId = (session.user as any).id;

  // If a specific copy was requested, validate it belongs to this book
  if (copyId) {
    const copy = await prisma.bookCopy.findUnique({ where: { id: copyId } });
    if (!copy || copy.bookId !== bookId) {
      return NextResponse.json({ error: "Invalid copy" }, { status: 400 });
    }
    if (copy.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Copy is not available" }, { status: 409 });
    }

    // Check for duplicate hold on this specific copy
    const existing = await prisma.hold.findUnique({
      where: { memberId_copyId: { memberId, copyId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Hold already placed on this copy" }, { status: 409 });
    }
  }

  const position = (await prisma.hold.count({
    where: { bookId, status: "WAITING" },
  })) + 1;

  // Use a transaction so the copy status and hold are created atomically
  const hold = await prisma.$transaction(async (tx) => {
    const newHold = await tx.hold.create({
      data: { memberId, bookId, copyId: copyId ?? null, position },
    });

    if (copyId) {
      await tx.bookCopy.update({
        where: { id: copyId },
        data:  { status: "ON_HOLD" },
      });
    }

    return newHold;
  });

  return NextResponse.json(hold, { status: 201 });
}


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const memberId = (session.user as any).id;
  const holds = await prisma.hold.findMany({
    where:   { memberId },
    include: { book: true, copy: true },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json(holds);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { holdId } = await req.json();
  const memberId   = (session.user as any).id;

  await prisma.hold.deleteMany({ where: { id: holdId, memberId } });
  return NextResponse.json({ ok: true });
}
