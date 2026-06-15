import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateMembershipId } from "@/lib/utils";

// Zod schema for validating the citizen registration form input
const applySchema = z.object({
  name:         z.string().min(2).max(100),
  email:        z.string().email(),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar number must be exactly 12 digits"),
  phone:        z.string().min(10, "Phone number must be at least 10 characters"),
  otpCode:      z.string().length(6, "Verification code must be exactly 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = applySchema.parse(body);

    // Verify OTP code first
    const latestOtp = await prisma.otp.findFirst({
      where: { phone: data.phone },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp) {
      return NextResponse.json(
        { error: "No verification code was sent to this phone number." },
        { status: 400 }
      );
    }

    if (latestOtp.code !== data.otpCode) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    if (latestOtp.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if email or aadhar is already registered
    const existing = await prisma.member.findFirst({
      where: { OR: [{ email: data.email }, { aadharNumber: data.aadharNumber }] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email or Aadhar Number already registered." },
        { status: 409 }
      );
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const membershipId = generateMembershipId();
    const expiresAt    = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create member
    const member = await prisma.member.create({
      data: {
        name:         data.name,
        email:        data.email,
        aadharNumber: data.aadharNumber,
        phone:        data.phone,
        department:   "Citizen",
        membershipId,
        passwordHash,
        expiresAt,
        status:       "PENDING",
      },
    });

    // Delete verified OTPs for this phone number
    await prisma.otp.deleteMany({
      where: { phone: data.phone },
    });

    return NextResponse.json({
      message:      "Application submitted. Await librarian approval — you will receive login credentials by email.",
      membershipId: member.membershipId,
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      const firstError = err.errors[0]?.message || "Validation error";
      return NextResponse.json({ error: firstError }, { status: 422 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
