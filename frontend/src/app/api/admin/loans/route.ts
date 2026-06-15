import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff, requireLibrarian } from "@/lib/session";
import { z } from "zod";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const returnSchema = z.object({
  loanId: z.string().min(1),
});

const issueSchema = z.object({
  membershipId: z.string().min(1),
  barcode:      z.string().min(1),
});

// GET — all active + overdue loans with member and book info
export async function GET() {
  const { session, response } = await requireStaff();
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

// POST — issue a book (create checkout loan)
export async function POST(req: NextRequest) {
  const { session, response } = await requireLibrarian();
  if (!session) return response!;

  try {
    const body = await req.json();
    const { membershipId, barcode } = issueSchema.parse(body);

    // Find the member
    const member = await prisma.member.findUnique({
      where: { membershipId },
      include: { loans: { where: { status: "ACTIVE" } } },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.status !== "ACTIVE") {
      return NextResponse.json({ error: "Member account is not active" }, { status: 403 });
    }
    if (member.loans.length >= 5) {
      return NextResponse.json({ error: "Member has reached the maximum limit of 5 active loans" }, { status: 400 });
    }

    // Find the physical copy of the book
    const copy = await prisma.bookCopy.findUnique({
      where: { barcode },
      include: { book: true },
    });

    if (!copy) {
      return NextResponse.json({ error: "Physical copy barcode not found" }, { status: 404 });
    }
    if (copy.status !== "AVAILABLE") {
      return NextResponse.json({ error: `Book copy is currently ${copy.status.toLowerCase().replace('_', ' ')}` }, { status: 409 });
    }

    // Create loan in transaction
    const loan = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          memberId: member.id,
          bookId:   copy.bookId,
          dueDate:  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days loan
          status:   "ACTIVE",
        },
      });

      // Update copy status
      await tx.bookCopy.update({
        where: { id: copy.id },
        data:  { status: "CHECKED_OUT" },
      });

      // Decrement available copies of book
      await tx.book.update({
        where: { id: copy.bookId },
        data:  { availableCopies: { decrement: 1 } },
      });

      return newLoan;
    });

    // Notify member via WhatsApp
    if (member.phone) {
      const formattedDate = new Date(loan.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const message = `Hi ${member.name}, you have successfully checked out "${copy.book.title}" (Barcode: ${barcode}). It is due for return by ${formattedDate}.`;
      
      sendWhatsAppMessage(member.phone, message).catch((err) => {
        console.error("Failed to send checkout WhatsApp notification:", err);
      });
    }

    return NextResponse.json(loan, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH — mark a loan as returned
export async function PATCH(req: NextRequest) {
  const { session, response } = await requireStaff();
  if (!session) return response!;

  try {
    const body = await req.json();
    const { loanId } = returnSchema.parse(body);

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    if (loan.status === "RETURNED") {
      return NextResponse.json({ error: "Already returned" }, { status: 409 });
    }

    const promotedHold = await prisma.$transaction(async (tx) => {
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
        return await tx.hold.update({
          where: { id: nextHold.id },
          data:  { status: "READY", expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
          include: {
            member: true,
            book: true,
          },
        });
      }
      return null;
    });

    if (promotedHold && promotedHold.member.phone && promotedHold.expiresAt) {
      const formattedDate = new Date(promotedHold.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const message = `Hi ${promotedHold.member.name}, the book "${promotedHold.book.title}" you placed on hold is now READY for pickup! It will be held for you at the library until ${formattedDate}.`;

      sendWhatsAppMessage(promotedHold.member.phone, message).catch((err) => {
        console.error("Failed to send hold ready WhatsApp notification:", err);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
