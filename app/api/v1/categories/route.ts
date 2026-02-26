import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";

const DEFAULT_CATEGORIES = [
  "Food & Dining", "Transportation", "Shopping", "Entertainment",
  "Bills & Utilities", "Health & Medical", "Education", "Travel",
  "Personal Care", "Gifts & Donations", "Investments", "Other"
];

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const { data: userCategories } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", u.id)
      .order("name");

    const categories = [
      ...DEFAULT_CATEGORIES.map((name) => ({ id: null, name, isDefault: true })),
      ...(userCategories ?? []).map((c: { id: string; name: string }) => ({ ...c, isDefault: false })),
    ];

    return NextResponse.json(categories);
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Category name required" }, { status: 400 });

    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });

    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: u.id, name })
      .select("id, name")
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
