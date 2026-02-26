import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const purposes = Array.isArray(body.purposes) ? body.purposes : [];
    if (purposes.length === 0) return NextResponse.json({ error: "No consent purposes provided" }, { status: 400 });

    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    const rows = purposes.map((p: string) => ({
      user_id: u.id,
      purpose: p,
      granted: true,
      version: body.version || "1.0",
      ip_address: ip,
    }));

    const { error } = await supabase.from("consent_logs").insert(rows);
    if (error) throw error;

    await supabase.from("audit_logs").insert({
      user_id: u.id,
      action: "consent_granted",
      meta: { purposes, version: body.version || "1.0" },
    });

    return NextResponse.json({ consented: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const { data } = await supabase
      .from("consent_logs")
      .select("purpose, granted, version, created_at")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false });

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
