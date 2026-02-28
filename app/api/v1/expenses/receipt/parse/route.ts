import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { getOrCreateUser } from "@/lib/user";
import { parseDocumentImage, type DocumentType } from "@/lib/ai";
import { createServerClient } from "@/lib/supabase";
import { checkRateLimit } from "@/utils/rateLimiter";

/** POST: parse receipt/invoice image only; no expense created. Returns parsed data for review. */
export async function POST(request: Request) {
  const forwarded =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const { ok } = checkRateLimit(forwarded, "receipt");
  if (!ok) {
    return NextResponse.json({ error: "Too many requests", retryAfter: 60 }, { status: 429 });
  }

  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    let base64Image: string | null = null;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        base64Image = buffer.toString("base64");
      }
    } else {
      const body = await request.json().catch(() => null);
      if (body?.image) base64Image = body.image;
    }

    if (!base64Image) {
      return NextResponse.json({ error: "Missing image (send multipart 'image' or JSON { image: base64 })" }, { status: 400 });
    }

    const typeHeader = (request.headers.get("x-document-type") || "receipt").toLowerCase();
    const docType: DocumentType =
      typeHeader === "invoice" || typeHeader === "bill" ? typeHeader : "receipt";
    const parsed = await parseDocumentImage(base64Image, docType);

    return NextResponse.json({
      parsed: {
        merchant: parsed.merchant,
        amount: parsed.amount,
        date: parsed.date,
        currency: parsed.currency,
        items: parsed.items,
      },
      ai_used: true,
    });
  } catch (e) {
    console.error("[receipt/parse]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
