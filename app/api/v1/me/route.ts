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
    const user = await getOrCreateUser(supabase, userId);
    if (!user) return NextResponse.json({ error: "Could not load or create account" }, { status: 500 });
    return NextResponse.json({
      id: user.id,
      clerk_id: user.clerk_id,
      profession: user.profession,
      primary_goal: user.primary_goal,
      preferred_currency: user.preferred_currency ?? "USD",
      starting_balance: user.starting_balance ?? 0,
      onboarding_completed_at: user.onboarding_completed_at ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
