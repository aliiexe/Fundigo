import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { logAudit } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const { data: before } = await supabase
      .from("income_sources")
      .select("*")
      .eq("id", id)
      .eq("user_id", u.id)
      .single();
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.frequency !== undefined) updates.frequency = body.frequency;
    if (body.note !== undefined) updates.note = body.note;
    updates.updated_at = new Date().toISOString();

    const { data: after, error } = await supabase
      .from("income_sources")
      .update(updates)
      .eq("id", id)
      .eq("user_id", u.id)
      .select("*")
      .single();
    if (error) throw error;

    await logAudit(supabase, u.id, "income_updated", { id, before, after });
    return NextResponse.json(after);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const { data: before } = await supabase
      .from("income_sources")
      .select("*")
      .eq("id", id)
      .eq("user_id", u.id)
      .single();
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { error } = await supabase
      .from("income_sources")
      .delete()
      .eq("id", id)
      .eq("user_id", u.id);
    if (error) throw error;

    await logAudit(supabase, u.id, "income_deleted", { id, deleted: before });
    return NextResponse.json({ deleted: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
