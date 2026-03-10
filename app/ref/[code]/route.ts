import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const upperCode = code.toUpperCase();

  // Look up the affiliate by code
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id")
    .eq("affiliate_code", upperCode)
    .eq("status", "active")
    .single();

  if (affiliate) {
    // Record the click
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;
    const referrer = req.headers.get("referer") ?? null;

    await supabase.from("affiliate_clicks").insert({
      affiliate_id: affiliate.id,
      ip_address: ip,
      user_agent: userAgent,
      referrer: referrer,
    });
  }

  // Redirect to homepage with ref param + set cookie (30 days)
  const redirectUrl = new URL("/", req.url);
  redirectUrl.searchParams.set("ref", upperCode);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("af_ref", upperCode, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
