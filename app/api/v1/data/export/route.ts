import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { checkRateLimit } from "@/utils/rateLimiter";
import { auditLog } from "@/utils/logger";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const { ok } = checkRateLimit(forwarded, "export");
  if (!ok) return NextResponse.json({ error: "Too many requests", retryAfter: 60 }, { status: 429 });
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    await auditLog(supabase, u.id, "data_export", { format: "zip" });
    return NextResponse.json({ message: "Export queued", downloadUrl: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
