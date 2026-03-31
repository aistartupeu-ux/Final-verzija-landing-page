import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPassword, createAffiliateToken } from "@/lib/affiliate";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email i lozinka su obavezni" }, { status: 400 });
    }

    const { data: affiliate, error } = await supabase
      .from("affiliates")
      .select("id, name, email, password_hash, affiliate_code, commission_rate, status")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !affiliate) {
      return NextResponse.json({ error: "Pogrešan email ili lozinka" }, { status: 401 });
    }

    if (affiliate.status === "suspended") {
      return NextResponse.json({ error: "Nalog je suspendovan. Kontaktirajte podršku." }, { status: 403 });
    }

    const valid = verifyPassword(password, affiliate.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Pogrešan email ili lozinka" }, { status: 401 });
    }

    const token = createAffiliateToken(affiliate.id, affiliate.email);

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        affiliateCode: affiliate.affiliate_code,
        commissionRate: affiliate.commission_rate,
        token,
      },
    });
  } catch (err) {
    console.error("Affiliate login exception:", err);
    return NextResponse.json({ error: "Server greška" }, { status: 500 });
  }
}
