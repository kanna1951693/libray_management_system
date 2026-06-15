import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q         = searchParams.get("q")?.trim() ?? "";
  const category  = searchParams.get("category") ?? "";
  const available = searchParams.get("available") === "true";
  const sort      = searchParams.get("sort") ?? "relevance";
  const page      = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit     = 12;
  const skip      = (page - 1) * limit;

  const where: any = {};

  if (q) {
    where.OR = [
      { title:       { contains: q, mode: "insensitive" } },
      { author:      { contains: q, mode: "insensitive" } },
      { isbn:        { contains: q, mode: "insensitive" } },
      { category:    { contains: q, mode: "insensitive" } },
      { publisher:   { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { location:    { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { equals: category, mode: "insensitive" };
  }

  if (available) {
    where.availableCopies = { gt: 0 };
  }

  // Build orderBy
  let orderBy: any;
  if (sort === "author") {
    orderBy = { author: "asc" };
  } else if (sort === "year") {
    orderBy = { year: "desc" };
  } else if (sort === "title") {
    orderBy = { title: "asc" };
  } else if (sort === "relevance" && q) {
    // Relevance: title matches first, then author, then others — use multiple sorts
    // Primary: books whose title starts with the query rank highest
    // We approximate this with Prisma by fetching all matches and sorting in-memory
    // for small datasets, or use raw SQL for larger ones.
    orderBy = [{ title: "asc" }]; // will be re-ranked below
  } else {
    orderBy = { title: "asc" };
  }

  const [allMatches, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy,
      select: {
        id: true, title: true, author: true, category: true,
        year: true, availableCopies: true, totalCopies: true,
        coverImage: true, publisher: true, description: true, isbn: true,
      },
      // For relevance sorting, fetch all and rank in-memory; for others, paginate directly
      ...(sort === "relevance" && q ? {} : { skip, take: limit }),
    }),
    prisma.book.count({ where }),
  ]);

  let books: typeof allMatches;

  if (sort === "relevance" && q) {
    // Score each result: title-start=4, title-contains=3, author=2, other=1
    const lq = q.toLowerCase();
    const scored = allMatches.map((b) => {
      const tl = b.title.toLowerCase();
      const al = b.author.toLowerCase();
      const score =
        tl.startsWith(lq)         ? 4
        : tl.includes(lq)         ? 3
        : al.startsWith(lq)       ? 2.5
        : al.includes(lq)         ? 2
        : b.isbn?.includes(lq)    ? 1.5
        : 1;
      return { ...b, _score: score };
    });
    scored.sort((a, b) => b._score - a._score || a.title.localeCompare(b.title));
    books = scored.slice(skip, skip + limit).map(({ _score, ...rest }) => rest) as typeof allMatches;
  } else {
    books = allMatches;
  }

  return NextResponse.json({
    books,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
