import { NextResponse } from "next/server";
import { requireMember } from "@/lib/session";
import { prisma } from "@/lib/db";
import { calculateFine } from "@/lib/utils";

export async function GET() {
  const { session, response } = await requireMember();
  if (!session) return response!;

  const memberId = session.user.id;

  // Auto-mark overdue loans
  await prisma.loan.updateMany({
    where: { memberId, status: "ACTIVE", dueDate: { lt: new Date() } },
    data:  { status: "OVERDUE" },
  });

  const loans = await prisma.loan.findMany({
    where:   { memberId, status: { in: ["ACTIVE", "OVERDUE"] } },
    include: { book: true },
    orderBy: { dueDate: "asc" },
  });

  const enriched = loans.map((l) => ({
    ...l,
    fine: l.status === "OVERDUE" ? calculateFine(l.dueDate) : 0,
  }));

  return NextResponse.json(enriched);
}
