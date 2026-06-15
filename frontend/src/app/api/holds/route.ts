import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { z } from "zod";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

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
        include: {
          book: { select: { title: true } },
          member: { select: { name: true, phone: true } },
        },
      });
      if (copyId) {
        await tx.bookCopy.update({ where: { id: copyId }, data: { status: "ON_HOLD" } });
      }
      return newHold;
    });

    if (hold.member.phone) {
      const message = `Hi ${hold.member.name}, you have successfully placed a hold on "${hold.book.title}". Your queue position is #${hold.position}. We'll notify you when it's ready.`;
      
      sendWhatsAppMessage(hold.member.phone, message).catch((err) => {
        console.error("Failed to send hold placement WhatsApp:", err);
      });
    }

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
    const memberId = session.user.id;

    // Find the hold first
    const hold = await prisma.hold.findFirst({
      where: { id: holdId, memberId },
    });

    if (!hold) {
      return NextResponse.json({ error: "Hold not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete the hold
      await tx.hold.delete({
        where: { id: holdId },
      });

      // If the hold had an assigned copy, we need to release it
      if (hold.copyId) {
        // Find if there is another WAITING hold for the same book
        const nextHold = await tx.hold.findFirst({
          where: { bookId: hold.bookId, status: "WAITING" },
          orderBy: { position: "asc" },
        });

        if (nextHold) {
          // Assign this copy to the next hold and mark it READY
          const updatedNextHold = await tx.hold.update({
            where: { id: nextHold.id },
            data: {
              copyId: hold.copyId,
              status: "READY",
              expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
            include: {
              member: true,
              book: true,
            },
          });
          return { promotedHold: updatedNextHold };
        } else {
          // No one else is waiting, make copy AVAILABLE and increment book availableCopies
          await tx.bookCopy.update({
            where: { id: hold.copyId },
            data: { status: "AVAILABLE" },
          });
          await tx.book.update({
            where: { id: hold.bookId },
            data: { availableCopies: { increment: 1 } },
          });
        }
      }

      // Re-order the positions of the remaining WAITING holds for the same book
      const remainingHolds = await tx.hold.findMany({
        where: { bookId: hold.bookId, status: "WAITING" },
        orderBy: { position: "asc" },
      });

      for (let i = 0; i < remainingHolds.length; i++) {
        await tx.hold.update({
          where: { id: remainingHolds[i].id },
          data: { position: i + 1 },
        });
      }

      return { promotedHold: null };
    });

    if (result?.promotedHold && result.promotedHold.member.phone && result.promotedHold.expiresAt) {
      const formattedDate = new Date(result.promotedHold.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const message = `Hi ${result.promotedHold.member.name}, the book "${result.promotedHold.book.title}" you placed on hold is now READY for pickup! It will be held for you at the library until ${formattedDate}.`;

      sendWhatsAppMessage(result.promotedHold.member.phone, message).catch((err) => {
        console.error("Failed to send hold ready WhatsApp:", err);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
