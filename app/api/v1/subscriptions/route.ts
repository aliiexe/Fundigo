import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { addSubscriptionBody } from "@/lib/validators";
import { logTransaction } from "@/lib/transactions";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    const { data, error } = await supabase
      .from("subscriptions")
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
    const parsed = addSubscriptionBody.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: u.id,
        service_name: parsed.data.service_name,
        plan: parsed.data.plan ?? null,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        period: parsed.data.period,
        next_billing_date: parsed.data.next_billing_date ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    await logTransaction(supabase, u.id, "subscription", parsed.data.amount, parsed.data.currency,
      `Subscription added: ${parsed.data.service_name} (${parsed.data.period})`, data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
