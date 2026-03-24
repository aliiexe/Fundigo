import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { decryptText } from "@/lib/crypto";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    let query = supabase
      .from("expenses")
      .select("id, merchant_cipher, amount, currency, date, category_id")
      .eq("user_id", u.id)
      .order("date", { ascending: false })
      .limit(200);

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      query = query.gte("date", `${month}-01`).lte("date", `${month}-${String(lastDay).padStart(2, "0")}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const catIds = [...new Set(rows.map((e) => e.category_id).filter(Boolean))] as string[];
    const idToName: Record<string, string> = {};
    if (catIds.length > 0) {
      const { data: cats } = await supabase.from("categories").select("id, name").in("id", catIds);
      for (const c of cats ?? []) {
        idToName[String(c.id)] = String(c.name);
      }
    }

    const expenses = rows.map((e) => {
      let merchant = "Expense";
      try {
        const parsed = JSON.parse(e.merchant_cipher);
        if (parsed.ciphertext && parsed.iv && parsed.tag) {
          merchant = decryptText(parsed.ciphertext, parsed.iv, parsed.tag);
        }
      } catch {
        merchant = e.merchant_cipher;
      }
      const category =
        e.category_id && idToName[String(e.category_id)] ? idToName[String(e.category_id)] : undefined;
      return { id: e.id, merchant, amount: Number(e.amount), currency: e.currency, date: e.date, category };
    });

    return NextResponse.json(expenses);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
