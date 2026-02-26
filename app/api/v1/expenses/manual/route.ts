import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { addExpenseManualBody } from "@/lib/validators";
import { encryptText } from "@/lib/crypto";
import { categorizeExpense } from "@/lib/ai";
import { logTransaction } from "@/lib/transactions";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const parsed = addExpenseManualBody.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    let merchantCipher = parsed.data.merchant;
    let rawTextCipher: string | null = null;
    if (!u.e2e_encrypted) {
      const encMerchant = encryptText(parsed.data.merchant);
      merchantCipher = JSON.stringify(encMerchant);
      if (parsed.data.raw_text) {
        const encRaw = encryptText(parsed.data.raw_text);
        rawTextCipher = JSON.stringify(encRaw);
      }
    }

    let categoryId = parsed.data.category_id ?? null;

    if (!categoryId && !parsed.data.category) {
      const suggestedCategory = await categorizeExpense(parsed.data.merchant, parsed.data.amount);
      const { data: existingCat } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", u.id)
        .eq("name", suggestedCategory)
        .single();

      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        const { data: newCat } = await supabase
          .from("categories")
          .insert({ user_id: u.id, name: suggestedCategory })
          .select("id")
          .single();
        if (newCat) categoryId = newCat.id;
      }
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: u.id,
        merchant_cipher: merchantCipher,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        category_id: categoryId,
        raw_text_cipher: rawTextCipher,
        date: parsed.data.date ?? new Date().toISOString().slice(0, 10),
      })
      .select("id, category_id")
      .single();
    if (error) throw error;

    let ai_category: string | null = null;
    if (categoryId && !parsed.data.category_id && !parsed.data.category) {
      const { data: catRow } = await supabase.from("categories").select("name").eq("id", categoryId).single();
      if (catRow) ai_category = catRow.name;
    }

    await logTransaction(supabase, u.id, "expense", parsed.data.amount, parsed.data.currency,
      `Expense: ${parsed.data.merchant}`, data.id);
    return NextResponse.json({ ...data, ai_category }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
