import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { encryptText } from "@/lib/crypto";
import { parseReceiptImage } from "@/lib/ai";

export async function POST(request: Request) {
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

    let parsed = {
      merchant: "Unknown merchant",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      currency: u.preferred_currency || "USD",
      items: [] as string[],
    };
    let aiUsed = false;

    if (base64Image) {
      const aiResult = await parseReceiptImage(base64Image);
      if (aiResult) {
        parsed = aiResult;
        aiUsed = true;
      }
    }

    const merchantCipher = JSON.stringify(encryptText(parsed.merchant));
    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        user_id: u.id,
        merchant_cipher: merchantCipher,
        amount: parsed.amount,
        currency: parsed.currency,
        date: parsed.date,
      })
      .select("id")
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      user_id: u.id,
      action: "receipt_upload",
      meta: { expense_id: expense.id, ai_used: aiUsed, items: parsed.items },
    });

    return NextResponse.json(
      {
        expense_id: expense.id,
        parsed,
        ai_used: aiUsed,
        message: aiUsed
          ? "Parsed via AI — review the details"
          : "No image provided or AI unavailable — add details manually",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
