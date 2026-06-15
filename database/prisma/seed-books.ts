import { PrismaClient, Role, MemberStatus } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const books = [
  // ── MATHEMATICS (5) ──────────────────────────────────────────────────────────
  {
    title:       "Principia Mathematica",
    author:      "Alfred North Whitehead & Bertrand Russell",
    isbn:        "978-0521067911",
    category:    "Mathematics",
    publisher:   "Cambridge University Press",
    year:        1910,
    totalCopies: 3,
    pages:       666,
    language:    "English",
    location:    "Shelf M-01",
    description: "A landmark three-volume work on the foundations of mathematics, presenting a rigorous logical foundation for all of mathematics through symbolic logic.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780521067911-L.jpg",
  },
  {
    title:       "Introduction to Linear Algebra",
    author:      "Gilbert Strang",
    isbn:        "978-0980232776",
    category:    "Mathematics",
    publisher:   "Wellesley-Cambridge Press",
    year:        2016,
    totalCopies: 5,
    pages:       600,
    language:    "English",
    location:    "Shelf M-02",
    description: "The world's most widely used linear algebra textbook, renowned for its clear explanations, geometric insight, and real-world applications.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780980232776-L.jpg",
  },
  {
    title:       "Calculus, Vol. 1",
    author:      "Tom M. Apostol",
    isbn:        "978-0471000051",
    category:    "Mathematics",
    publisher:   "Wiley",
    year:        1967,
    totalCopies: 4,
    pages:       666,
    language:    "English",
    location:    "Shelf M-03",
    description: "A rigorous and complete treatment of single-variable calculus by one of the greatest mathematics educators of the 20th century.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780471000051-L.jpg",
  },
  {
    title:       "Abstract Algebra",
    author:      "David S. Dummit & Richard M. Foote",
    isbn:        "978-0471433347",
    category:    "Mathematics",
    publisher:   "Wiley",
    year:        2003,
    totalCopies: 3,
    pages:       944,
    language:    "English",
    location:    "Shelf M-04",
    description: "The definitive graduate-level text on abstract algebra, covering groups, rings, fields, modules and Galois theory with comprehensive exercises.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780471433347-L.jpg",
  },
  {
    title:       "The Art of Problem Solving, Vol. 1",
    author:      "Richard Rusczyk & Sandor Lehoczky",
    isbn:        "978-1885875006",
    category:    "Mathematics",
    publisher:   "AoPS Incorporated",
    year:        1993,
    totalCopies: 4,
    pages:       272,
    language:    "English",
    location:    "Shelf M-05",
    description: "The bible of mathematical competition preparation, teaching creative problem-solving skills and mathematical thinking beyond the standard curriculum.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9781885875006-L.jpg",
  },

  // ── PHYSICS (5) ──────────────────────────────────────────────────────────────
  {
    title:       "A Brief History of Time",
    author:      "Stephen Hawking",
    isbn:        "978-0553380163",
    category:    "Physics",
    publisher:   "Bantam Books",
    year:        1988,
    totalCopies: 6,
    pages:       212,
    language:    "English",
    location:    "Shelf P-01",
    description: "Stephen Hawking's groundbreaking exploration of the universe's biggest questions — from the Big Bang to black holes — written for a general audience.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg",
  },
  {
    title:       "The Feynman Lectures on Physics, Vol. 1",
    author:      "Richard P. Feynman",
    isbn:        "978-0201021165",
    category:    "Physics",
    publisher:   "Addison-Wesley",
    year:        1964,
    totalCopies: 4,
    pages:       560,
    language:    "English",
    location:    "Shelf P-02",
    description: "The legendary physics lectures by Nobel laureate Richard Feynman, celebrated for their clarity, depth, and brilliance across all of physics.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780201021165-L.jpg",
  },
  {
    title:       "The Elegant Universe",
    author:      "Brian Greene",
    isbn:        "978-0393338102",
    category:    "Physics",
    publisher:   "W. W. Norton & Company",
    year:        1999,
    totalCopies: 4,
    pages:       464,
    language:    "English",
    location:    "Shelf P-03",
    description: "A captivating journey into superstring theory and M-theory, explaining the quest for a unified theory of everything.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780393338102-L.jpg",
  },
  {
    title:       "Quantum Mechanics: The Theoretical Minimum",
    author:      "Leonard Susskind & Art Friedman",
    isbn:        "978-0465062904",
    category:    "Physics",
    publisher:   "Basic Books",
    year:        2014,
    totalCopies: 3,
    pages:       384,
    language:    "English",
    location:    "Shelf P-04",
    description: "A rigorous yet accessible introduction to quantum mechanics, co-authored by the physicist who invented modern string theory.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780465062904-L.jpg",
  },
  {
    title:       "Classical Mechanics",
    author:      "Herbert Goldstein",
    isbn:        "978-0201657029",
    category:    "Physics",
    publisher:   "Addison-Wesley",
    year:        2001,
    totalCopies: 3,
    pages:       638,
    language:    "English",
    location:    "Shelf P-05",
    description: "The gold standard graduate text on classical mechanics, covering Lagrangian and Hamiltonian formulations, chaos, and relativistic mechanics.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780201657029-L.jpg",
  },

  // ── ECONOMICS (5) ────────────────────────────────────────────────────────────
  {
    title:       "The Wealth of Nations",
    author:      "Adam Smith",
    isbn:        "978-0140432084",
    category:    "Economics",
    publisher:   "Penguin Classics",
    year:        1776,
    totalCopies: 4,
    pages:       1232,
    language:    "English",
    location:    "Shelf E-01",
    description: "The foundational text of modern economics, where Adam Smith introduces the concept of the invisible hand, division of labour, and free markets.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780140432084-L.jpg",
  },
  {
    title:       "Capital in the Twenty-First Century",
    author:      "Thomas Piketty",
    isbn:        "978-0674430006",
    category:    "Economics",
    publisher:   "Harvard University Press",
    year:        2013,
    totalCopies: 4,
    pages:       696,
    language:    "English",
    location:    "Shelf E-02",
    description: "A landmark study of wealth inequality across centuries, analysing the dynamics of capital accumulation and income distribution.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780674430006-L.jpg",
  },
  {
    title:       "Freakonomics",
    author:      "Steven D. Levitt & Stephen J. Dubner",
    isbn:        "978-0060731335",
    category:    "Economics",
    publisher:   "William Morrow",
    year:        2005,
    totalCopies: 5,
    pages:       320,
    language:    "English",
    location:    "Shelf E-03",
    description: "A rogue economist explores the hidden side of everything, using data to reveal surprising truths about how the world really works.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780060731335-L.jpg",
  },
  {
    title:       "Thinking, Fast and Slow",
    author:      "Daniel Kahneman",
    isbn:        "978-0374533557",
    category:    "Economics",
    publisher:   "Farrar, Straus and Giroux",
    year:        2011,
    totalCopies: 5,
    pages:       499,
    language:    "English",
    location:    "Shelf E-04",
    description: "Nobel laureate Kahneman reveals the two systems of thought that drive our decisions — fast, intuitive System 1 and slow, deliberate System 2.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg",
  },
  {
    title:       "The General Theory of Employment, Interest and Money",
    author:      "John Maynard Keynes",
    isbn:        "978-1613821305",
    category:    "Economics",
    publisher:   "Snowball Publishing",
    year:        1936,
    totalCopies: 3,
    pages:       472,
    language:    "English",
    location:    "Shelf E-05",
    description: "Keynes's masterwork that revolutionised macroeconomics, introducing the concepts of aggregate demand, fiscal policy, and the multiplier effect.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9781613821305-L.jpg",
  },

  // ── CHILDREN'S BOOKS (10) ────────────────────────────────────────────────────
  {
    title:       "Harry Potter and the Philosopher's Stone",
    author:      "J.K. Rowling",
    isbn:        "978-0439708180",
    category:    "Children",
    publisher:   "Scholastic",
    year:        1997,
    totalCopies: 8,
    pages:       309,
    language:    "English",
    location:    "Shelf C-01",
    description: "The magical beginning of Harry Potter's journey to Hogwarts, where he discovers he is a wizard and faces the dark wizard Voldemort.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg",
  },
  {
    title:       "Charlotte's Web",
    author:      "E.B. White",
    isbn:        "978-0061124952",
    category:    "Children",
    publisher:   "HarperCollins",
    year:        1952,
    totalCopies: 6,
    pages:       184,
    language:    "English",
    location:    "Shelf C-02",
    description: "The timeless story of friendship between a pig named Wilbur and the spider Charlotte, who uses her web to save his life.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780061124952-L.jpg",
  },
  {
    title:       "The Little Prince",
    author:      "Antoine de Saint-Exupery",
    isbn:        "978-0156012195",
    category:    "Children",
    publisher:   "Harcourt",
    year:        1943,
    totalCopies: 7,
    pages:       96,
    language:    "English",
    location:    "Shelf C-03",
    description: "A beloved philosophical tale of a young prince who travels from planet to planet, learning about love, loneliness, and what truly matters.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg",
  },
  {
    title:       "Charlie and the Chocolate Factory",
    author:      "Roald Dahl",
    isbn:        "978-0142410318",
    category:    "Children",
    publisher:   "Puffin Books",
    year:        1964,
    totalCopies: 6,
    pages:       176,
    language:    "English",
    location:    "Shelf C-04",
    description: "Young Charlie Bucket wins a golden ticket to the magical, mysterious factory of Willy Wonka — a story full of wonder and moral lessons.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780142410318-L.jpg",
  },
  {
    title:       "Where the Wild Things Are",
    author:      "Maurice Sendak",
    isbn:        "978-0064431781",
    category:    "Children",
    publisher:   "HarperCollins",
    year:        1963,
    totalCopies: 5,
    pages:       48,
    language:    "English",
    location:    "Shelf C-05",
    description: "Max sails to the land of Wild Things after being sent to bed without supper — a classic exploration of childhood imagination and emotion.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780064431781-L.jpg",
  },
  {
    title:       "The Very Hungry Caterpillar",
    author:      "Eric Carle",
    isbn:        "978-0399226908",
    category:    "Children",
    publisher:   "Philomel Books",
    year:        1969,
    totalCopies: 7,
    pages:       32,
    language:    "English",
    location:    "Shelf C-06",
    description: "A tiny caterpillar eats through a variety of foods before transforming into a beautiful butterfly — an iconic picture book beloved worldwide.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780399226908-L.jpg",
  },
  {
    title:       "Matilda",
    author:      "Roald Dahl",
    isbn:        "978-0142410370",
    category:    "Children",
    publisher:   "Puffin Books",
    year:        1988,
    totalCopies: 6,
    pages:       240,
    language:    "English",
    location:    "Shelf C-07",
    description: "The extraordinary story of Matilda, a brilliant girl with telekinetic powers who triumphs over her cruel parents and terrifying headmistress.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780142410370-L.jpg",
  },
  {
    title:       "The Hobbit",
    author:      "J.R.R. Tolkien",
    isbn:        "978-0547928227",
    category:    "Children",
    publisher:   "Houghton Mifflin Harcourt",
    year:        1937,
    totalCopies: 5,
    pages:       300,
    language:    "English",
    location:    "Shelf C-08",
    description: "Bilbo Baggins embarks on an unexpected adventure with thirteen dwarves and a wizard in this precursor to The Lord of the Rings.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
  },
  {
    title:       "Alice's Adventures in Wonderland",
    author:      "Lewis Carroll",
    isbn:        "978-0141439761",
    category:    "Children",
    publisher:   "Penguin Classics",
    year:        1865,
    totalCopies: 5,
    pages:       256,
    language:    "English",
    location:    "Shelf C-09",
    description: "Alice falls down a rabbit hole into a fantastical world of logic-defying creatures and absurd adventures in this immortal classic.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780141439761-L.jpg",
  },
  {
    title:       "Winnie-the-Pooh",
    author:      "A.A. Milne",
    isbn:        "978-0525444443",
    category:    "Children",
    publisher:   "Dutton Children's Books",
    year:        1926,
    totalCopies: 6,
    pages:       176,
    language:    "English",
    location:    "Shelf C-10",
    description: "The heartwarming adventures of Pooh Bear and his friends in the Hundred Acre Wood — a treasured story of friendship and simple joys.",
    coverImage:  "https://covers.openlibrary.org/b/isbn/9780525444443-L.jpg",
  },
];

async function main() {
  console.log("Seeding admin account...");

  const adminExists = await prisma.member.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!adminExists) {
    await prisma.member.create({
      data: {
        name:         "Library Admin",
        email:        "admin@library.local",
        aadharNumber: "ADMIN001",
        department:   "Administration",
        membershipId: "LIB-ADMIN-001",
        passwordHash: createHash("sha256").update("Admin@1234").digest("hex"),
        role:         Role.ADMIN,
        status:       MemberStatus.ACTIVE,
        expiresAt:    new Date("2099-12-31"),
      },
    });
    console.log("Admin created: admin@library.local / Admin@1234");
  } else {
    console.log("Admin already exists, skipping.");
  }

  console.log("\nSeeding librarian account...");

  const librarianExists = await prisma.member.findFirst({
    where: { role: Role.LIBRARIAN },
  });

  if (!librarianExists) {
    await prisma.member.create({
      data: {
        name:         "Head Librarian",
        email:        "librarian@library.local",
        aadharNumber: "LIB001",
        department:   "Library Services",
        membershipId: "LIB-STAFF-001",
        passwordHash: createHash("sha256").update("Lib@1234").digest("hex"),
        role:         Role.LIBRARIAN,
        status:       MemberStatus.ACTIVE,
        expiresAt:    new Date("2099-12-31"),
      },
    });
    console.log("Librarian created: librarian@library.local / Lib@1234");
  } else {
    console.log("Librarian already exists, skipping.");
  }

  console.log("\nSeeding famous books...");

  let created = 0;
  let skipped = 0;
  let copyCount = 0;

  // Track global copy index for unique barcodes across all books
  const existingCopies = await prisma.bookCopy.count();
  let copyIndex = existingCopies + 1;

  for (const book of books) {
    const exists = await prisma.book.findUnique({
      where: { isbn: book.isbn },
      include: { copies: true },
    });

    if (!exists) {
      const created_book = await prisma.book.create({
        data: { ...book, availableCopies: book.totalCopies },
      });
      console.log(`  [+] ${book.title} (${book.category})`);
      created++;

      // Seed physical copies with auto-generated barcodes
      for (let i = 0; i < book.totalCopies; i++) {
        const barcode = `COPY-${String(copyIndex).padStart(5, "0")}`;
        await prisma.bookCopy.create({
          data: {
            bookId:  created_book.id,
            barcode,
            status:  "AVAILABLE",
          },
        });
        copyIndex++;
        copyCount++;
      }
    } else {
      // Add any missing copies (in case totalCopies was increased)
      const missingCopies = exists.totalCopies - exists.copies.length;
      if (missingCopies > 0) {
        for (let i = 0; i < missingCopies; i++) {
          const barcode = `COPY-${String(copyIndex).padStart(5, "0")}`;
          await prisma.bookCopy.create({
            data: {
              bookId:  exists.id,
              barcode,
              status:  "AVAILABLE",
            },
          });
          copyIndex++;
          copyCount++;
        }
      }
      console.log(`  [=] Skipped (exists): ${book.title}`);
      skipped++;
    }
  }

  console.log(`\nDone! Created ${created} books, skipped ${skipped} existing, seeded ${copyCount} physical copies.`);
  console.log(`\nCredentials summary:`);
  console.log(`  Admin:     admin@library.local     / Admin@1234`);
  console.log(`  Librarian: librarian@library.local / Lib@1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
