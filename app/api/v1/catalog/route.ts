import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    const country = u.country_code?.toUpperCase();
    if (!country) return NextResponse.json([]);
    const { data, error } = await supabase
      .from("subscription_catalog")
      .select("id, service, plan, period, price_mad, currency, country_code")
      .eq("country_code", country)
      .order("service");
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
