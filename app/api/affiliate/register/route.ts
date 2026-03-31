import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPassword, generateAffiliateCode, createAffiliateToken } from "@/lib/affiliate";

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

    const { name, email, password, payoutEmail } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Ime, email i lozinka su obavezni" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Lozinka mora imati najmanje 6 karaktera" }, { status: 400 });
    }

    // Check if email already registered
    const { data: existing } = await supabase
      .from("affiliates")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Email je već registrovan" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const affiliateCode = generateAffiliateCode(name);

    const { data: affiliate, error } = await supabase
      .from("affiliates")
      .insert({
        name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        affiliate_code: affiliateCode,
        payout_email: payoutEmail ?? email.toLowerCase(),
        commission_rate: 30,
        status: "active",
      })
      .select("id, name, email, affiliate_code, commission_rate")
      .single();

    if (error) {
      console.error("Affiliate register error:", error);
      return NextResponse.json({ error: "Greška pri registraciji" }, { status: 500 });
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
    console.error("Affiliate register exception:", err);
    return NextResponse.json({ error: "Server greška" }, { status: 500 });
  }
}
