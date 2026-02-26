import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const type = searchParams.get("type");

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      query = query.gte("created_at", `${month}-01T00:00:00.000Z`).lte("created_at", `${month}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`);
    }
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
