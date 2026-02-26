import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getRates } from "@/lib/exchange";

export async function GET() {
  try {
    const rates = await getRates("USD");
    return NextResponse.json({ base: "USD", rates });
  } catch {
    return NextResponse.json({ error: "Could not fetch rates" }, { status: 500 });
  }
}
