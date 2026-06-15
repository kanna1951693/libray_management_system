import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [booksCount, activeMembersCount, categoriesRaw] = await Promise.all([
      prisma.book.aggregate({
        _sum: {
          totalCopies: true,
        },
      }),
      prisma.member.count({
        where: {
          status: "ACTIVE",
        },
      }),
      prisma.book.findMany({
        select: {
          category: true,
        },
        distinct: ["category"],
      }),
    ]);

    const totalBooks = booksCount._sum.totalCopies ?? 0;
    const totalCategories = categoriesRaw.length;

    return NextResponse.json({
      books: totalBooks,
      members: activeMembersCount,
      categories: totalCategories,
      years: 1, // Start with real year or a small constant, e.g. 1 year of service based on active DB history
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
