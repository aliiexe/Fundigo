import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { createGoalBody } from "@/lib/validators";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    const { data, error } = await supabase
      .from("goals")
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
    const parsed = createGoalBody.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: u.id,
        name: parsed.data.name,
        target_amount: parsed.data.target_amount,
        current_amount: parsed.data.current_amount ?? 0,
        currency: u.preferred_currency || "USD",
        deadline: parsed.data.deadline ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
