/**
 * Seed BookCopy rows for every existing Book.
 * Run with:  npx ts-node --skip-project prisma/seed-copies.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const books = await prisma.book.findMany();

  for (const book of books) {
    // Skip if copies already exist
    const existing = await prisma.bookCopy.count({ where: { bookId: book.id } });
    if (existing > 0) {
      console.log(`  ↳ ${book.title} — already has ${existing} copies, skipping`);
      continue;
    }

    // Use full cuid for uniqueness — barcodes look like BC-<8chars>-001
    const shortId = book.id.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
    const copies = [];

    for (let i = 1; i <= book.totalCopies; i++) {
      const padded  = String(i).padStart(3, "0");
      // Include book index to avoid any hash collision across books
      const barcode = `BC-${shortId}-${book.id.slice(-4).toUpperCase()}-${padded}`;

      // Determine status based on availableCopies
      // First (totalCopies - availableCopies) copies are CHECKED_OUT
      const checkedOutCount = book.totalCopies - book.availableCopies;
      const status = i <= checkedOutCount ? "CHECKED_OUT" : "AVAILABLE";

      copies.push({
        bookId:   book.id,
        barcode,
        status:   status as "AVAILABLE" | "CHECKED_OUT",
        location: book.location ?? null,
      });
    }

    await prisma.bookCopy.createMany({ data: copies });
    console.log(`✓ ${book.title} — seeded ${copies.length} copies`);
  }

  console.log("\nDone seeding BookCopy rows.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
