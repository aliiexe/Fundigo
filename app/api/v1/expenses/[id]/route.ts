import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { encryptText } from "@/lib/crypto";
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
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", u.id)
      .single();
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.merchant !== undefined) {
      updates.merchant_cipher = u.e2e_encrypted ? body.merchant : JSON.stringify(encryptText(body.merchant));
    }
    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.category_id !== undefined) updates.category_id = body.category_id;
    if (body.date !== undefined) updates.date = body.date;
    updates.updated_at = new Date().toISOString();

    const { data: after, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .eq("user_id", u.id)
      .select("*")
      .single();
    if (error) throw error;

    await logAudit(supabase, u.id, "expense_updated", { id, before, after });
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
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", u.id)
      .single();
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", u.id);
    if (error) throw error;

    await logAudit(supabase, u.id, "expense_deleted", { id, deleted: before });
    return NextResponse.json({ deleted: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
