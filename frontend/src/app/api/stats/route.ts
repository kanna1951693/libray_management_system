import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Cache stats for 60 seconds — they don't need to be real-time
export const revalidate = 60;

export async function GET() {
  try {
    const [booksAgg, activeMembersCount, categoriesRaw, overdueCount, activeLoansCount] =
      await Promise.all([
        prisma.book.aggregate({ _sum: { totalCopies: true } }),
        prisma.member.count({ where: { status: "ACTIVE" } }),
        prisma.book.findMany({ select: { category: true }, distinct: ["category"] }),
        prisma.loan.count({ where: { status: "OVERDUE" } }),
        prisma.loan.count({ where: { status: { in: ["ACTIVE", "OVERDUE"] } } }),
      ]);

    return NextResponse.json({
      books:        booksAgg._sum.totalCopies ?? 0,
      members:      activeMembersCount,
      categories:   categoriesRaw.length,
      overdueLoans: overdueCount,
      activeLoans:  activeLoansCount,
      years:        1,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
