import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getUserId } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getOrCreateUser } from "@/lib/user";
import { getCatalogRegion, REGION_NAMES } from "@/lib/catalog-regions";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = createServerClient();
    const u = await getOrCreateUser(supabase, userId);
    if (!u) return NextResponse.json({ error: "Could not load account" }, { status: 500 });
    const country = u.country_code?.toUpperCase();
    const catalogRegion = getCatalogRegion(country);
    if (!catalogRegion) return NextResponse.json({ catalog: [], catalog_region: null, is_fallback: false });
    const { data, error } = await supabase
      .from("subscription_catalog")
      .select("id, service, plan, period, price_mad, currency, country_code")
      .eq("country_code", catalogRegion)
      .order("service");
    if (error) throw error;
    const catalog = data ?? [];
    const isFallback = country !== catalogRegion;
    return NextResponse.json({
      catalog,
      catalog_region: catalogRegion,
      catalog_region_name: REGION_NAMES[catalogRegion],
      is_fallback: isFallback,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
