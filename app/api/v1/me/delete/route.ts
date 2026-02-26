import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function DELETE() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const { data: u } = await supabase.from("users").select("id").eq("clerk_id", userId).single();
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
    await supabase.from("users").update({ deleted_at: new Date().toISOString() }).eq("id", u.id);
    await supabase.from("jobs").insert({ type: "purge_user", payload: { user_id: u.id }, status: "pending" });
    return NextResponse.json({ message: "Account deletion scheduled" }, { status: 202 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
