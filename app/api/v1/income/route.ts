import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { addIncomeBody } from "@/lib/validators";
import { logTransaction } from "@/lib/transactions";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    const { data, error } = await supabase
      .from("income_sources")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const parsed = addIncomeBody.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    const { data, error } = await supabase
      .from("income_sources")
      .insert({
        user_id: u.id,
        name: parsed.data.name,
        amount: parsed.data.amount,
        currency: u.preferred_currency || "USD",
        frequency: parsed.data.frequency,
        note: parsed.data.note ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    const curr = u.preferred_currency || "USD";
    await logTransaction(supabase, u.id, "income", parsed.data.amount, curr,
      `Income added: ${parsed.data.name} (${parsed.data.frequency})`, data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
