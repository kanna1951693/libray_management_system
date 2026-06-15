import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { z } from "zod";

// Zod schema for validating the phone number input
const otpSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = otpSchema.parse(body);

    // Generate random 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiration

    // Save OTP to database
    await prisma.otp.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });

    const message = `Your City Library verification code is: ${code}. It is valid for 5 minutes.`;

    // Send WhatsApp notification asynchronously
    sendWhatsAppMessage(phone, message).catch((err) => {
      console.error("Failed to send OTP WhatsApp message:", err);
    });

    return NextResponse.json({ success: true, message: "Verification code sent successfully." });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors[0]?.message || "Invalid input" }, { status: 422 });
    }
    console.error("OTP generation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
