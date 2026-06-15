import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { z } from "zod";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const patchSchema = z.object({
  memberId: z.string().min(1),
  status:   z.enum(["ACTIVE", "PENDING", "EXPIRED", "SUSPENDED"]),
});

export async function GET() {
  const { session, response } = await requireStaff();
  if (!session) return response!;

  const members = await prisma.member.findMany({
    where:   { role: "MEMBER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, aadharNumber: true,
      department: true, membershipId: true, status: true,
      joinedAt: true, expiresAt: true, phone: true,
    },
  });

  return NextResponse.json(members);
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireStaff();
  if (!session) return response!;

  try {
    const body = await req.json();
    const { memberId, status } = patchSchema.parse(body);

    const updated = await prisma.member.update({
      where: { id: memberId },
      data:  { status },
    });

    if (status === "ACTIVE" && updated.phone) {
      const origin = req.nextUrl.origin;
      const message = `Hi ${updated.name}, your library membership has been approved! Your Membership ID is: ${updated.membershipId}. You can now log in at ${origin}/login`;
      
      // Async notification - do not await to prevent blocking the response
      sendWhatsAppMessage(updated.phone, message).catch((err) => {
        console.error("Failed to send membership activation WhatsApp:", err);
      });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
