import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { appendAffiliateConversionToSheet, isAffiliateSheetConfigured } from "@/lib/affiliate-sheet";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Call this endpoint when a sale is completed.
// This supports:
// - payment webhooks (server-to-server) that send affiliate_code explicitly
// - GHL workflows (Webhook action) that can send email + affiliate_code + amount
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderAmount = Number(body.orderAmount ?? body.order_amount ?? 0);
    const orderId = (body.orderId ?? body.order_id ?? null) as string | null;
    const currency = (body.currency ?? "EUR") as string;
    const conversionType = (body.conversionType ?? body.conversion_type ?? "purchase") as string;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;

    if (!orderAmount || orderAmount <= 0) {
      return NextResponse.json({ error: "Iznos narudžbine je obavezan" }, { status: 400 });
    }

    // Prefer affiliate_code from webhook payload (server-to-server).
    // Fallback: cookie (works only when called from same browser, not from GHL/payment webhooks).
    const afRefRaw =
      (typeof body.affiliate_code === "string" ? body.affiliate_code : null) ??
      req.cookies.get("af_ref")?.value ??
      null;
    const afRef = afRefRaw ? String(afRefRaw).trim().toLowerCase() : null;

    if (!afRef) {
      // No affiliate cookie — no commission to track
      return NextResponse.json({ success: true, attributed: false });
    }

    // Look up affiliate
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, commission_rate")
      .eq("affiliate_code", afRef)
      .eq("status", "active")
      .single();

    if (!affiliate) {
      return NextResponse.json({ success: true, attributed: false });
    }

    const commissionAmount = (orderAmount * Number(affiliate.commission_rate)) / 100;

    // Find most recent click for this affiliate to link conversion
    const { data: lastClick } = await supabase
      .from("affiliate_clicks")
      .select("id")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    await supabase.from("affiliate_conversions").insert({
      affiliate_id: affiliate.id,
      click_id: lastClick?.id ?? null,
      order_amount: orderAmount,
      commission_amount: commissionAmount,
      status: "pending",
      // If your table has extra columns, Supabase will ignore unknown ones;
      // we keep the payload minimal here.
    });

    // Append to Affiliate Google Sheet (optional but recommended)
    if (isAffiliateSheetConfigured()) {
      await appendAffiliateConversionToSheet({
        created_at: new Date().toISOString(),
        email: email ?? "",
        phone,
        affiliate_code: afRef,
        order_amount: orderAmount,
        currency,
        order_id: orderId,
        conversion_type: conversionType,
        commission_rate: Number(affiliate.commission_rate),
        commission_amount: commissionAmount,
        status: "pending",
      });
    }

    return NextResponse.json({
      success: true,
      attributed: true,
      commissionAmount,
      affiliateCode: afRef,
    });
  } catch (err) {
    console.error("Affiliate conversion exception:", err);
    return NextResponse.json({ error: "Server greška" }, { status: 500 });
  }
}
