import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Call this endpoint when a sale is completed
// Include the order amount and read af_ref cookie to attribute the commission
export async function POST(req: NextRequest) {
  try {
    const { orderAmount, orderId } = await req.json();

    if (!orderAmount || orderAmount <= 0) {
      return NextResponse.json({ error: "Iznos narudžbine je obavezan" }, { status: 400 });
    }

    // Read affiliate ref from cookie
    const afRef = req.cookies.get("af_ref")?.value;

    if (!afRef) {
      // No affiliate cookie — no commission to track
      return NextResponse.json({ success: true, attributed: false });
    }

    // Look up affiliate
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, commission_rate")
      .eq("affiliate_code", afRef.toUpperCase())
      .eq("status", "active")
      .single();

    if (!affiliate) {
      return NextResponse.json({ success: true, attributed: false });
    }

    const commissionAmount = (orderAmount * affiliate.commission_rate) / 100;

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
    });

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
