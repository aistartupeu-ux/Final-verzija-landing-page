/**
 * GET /api/affiliate/sheet-status — da li je Affiliate Sheet (direktan upis bez Make) podešen.
 */
import { NextResponse } from "next/server";
import { isAffiliateSheetConfigured } from "@/lib/affiliate-sheet";

export async function GET() {
  const sheetId = process.env.AFFILIATE_SHEET_ID;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!sheetId) {
    return NextResponse.json({
      configured: false,
      reason: "AFFILIATE_SHEET_ID env nije postavljen",
    });
  }
  if (!json) {
    return NextResponse.json({
      configured: false,
      reason: "GOOGLE_SERVICE_ACCOUNT_JSON env nije postavljen",
    });
  }

  try {
    const creds = JSON.parse(json) as { client_email?: string; private_key?: string };
    if (!creds.client_email || !creds.private_key) {
      return NextResponse.json({
        configured: false,
        reason: "JSON nema client_email ili private_key",
      });
    }
    return NextResponse.json({
      configured: isAffiliateSheetConfigured(),
      sheetId: sheetId.slice(0, 10) + "...",
      clientEmail: creds.client_email,
      clicksTab: process.env.AFFILIATE_SHEET_CLICKS_NAME || "Clicks",
      leadsTab: process.env.AFFILIATE_SHEET_LEADS_NAME || "Leads",
    });
  } catch {
    return NextResponse.json({
      configured: false,
      reason: "GOOGLE_SERVICE_ACCOUNT_JSON nije validan JSON",
    });
  }
}
