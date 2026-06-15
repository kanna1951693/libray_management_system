import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (!session) return response!;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if it is an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Generate unique file name
    const fileExt = file.name.split(".").pop() || "jpg";
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from("book-covers")
      .upload(cleanFileName, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Retrieve public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("book-covers")
      .getPublicUrl(cleanFileName);

    if (!urlData?.publicUrl) {
      return NextResponse.json({ error: "Failed to generate public URL" }, { status: 500 });
    }

    return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
  } catch (err: any) {
    console.error("Server upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
