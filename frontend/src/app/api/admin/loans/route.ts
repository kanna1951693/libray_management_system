import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { z } from "zod";

const returnSchema = z.object({
  loanId: z.string().min(1),
});

// GET — all active + overdue loans with member and book info
export async function GET() {
  const { session, response } = await requireAdmin();
  if (!session) return response!;

  // Auto-mark overdue loans globally
  await prisma.loan.updateMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    data:  { status: "OVERDUE" },
  });

  const loans = await prisma.loan.findMany({
    where:   { status: { in: ["ACTIVE", "OVERDUE"] } },
    include: {
      book:   { select: { id: true, title: true, author: true, coverImage: true } },
      member: { select: { id: true, name: true, email: true, membershipId: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(loans);
}

// PATCH — mark a loan as returned
export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (!session) return response!;

  try {
    const body = await req.json();
    const { loanId } = returnSchema.parse(body);

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    if (loan.status === "RETURNED") {
      return NextResponse.json({ error: "Already returned" }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      // Mark loan returned
      await tx.loan.update({
        where: { id: loanId },
        data:  { status: "RETURNED", returnedAt: new Date() },
      });
      // Increment available copies
      await tx.book.update({
        where: { id: loan.bookId },
        data:  { availableCopies: { increment: 1 } },
      });
      // Check if there's a waiting hold for this book — set first in queue to READY
      const nextHold = await tx.hold.findFirst({
        where:   { bookId: loan.bookId, status: "WAITING" },
        orderBy: { position: "asc" },
      });
      if (nextHold) {
        await tx.hold.update({
          where: { id: nextHold.id },
          data:  { status: "READY", expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
