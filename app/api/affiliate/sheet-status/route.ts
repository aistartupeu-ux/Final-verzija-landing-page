/**
 * GET /api/affiliate/sheet-status — da li je Affiliate Sheet (direktan upis bez Make) podešen.
 */
import { NextResponse } from "next/server";
import { isAffiliateSheetConfigured } from "@/lib/affiliate-sheet";
import { google } from "googleapis";

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

    const clicksTab = process.env.AFFILIATE_SHEET_CLICKS_NAME || "Clicks";
    const leadsTab = process.env.AFFILIATE_SHEET_LEADS_NAME || "Leads";
    const conversionsTab = process.env.AFFILIATE_SHEET_CONVERSIONS_NAME || "Conversions";

    // Try to fetch spreadsheet tabs to detect mismatches / permission issues.
    let sheetTitles: string[] | null = null;
    let sheetFetchError: string | null = null;
    try {
      const privateKey = String(creds.private_key).replace(/\\n/g, "\n");
      const auth = new google.auth.GoogleAuth({
        credentials: { ...creds, private_key: privateKey },
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
      const sheets = google.sheets({ version: "v4", auth });
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      sheetTitles = (meta.data.sheets ?? [])
        .map((s) => s.properties?.title)
        .filter((t): t is string => typeof t === "string" && t.length > 0);
    } catch (e) {
      const err = e as { message?: string };
      sheetFetchError = err?.message || String(e);
    }

    return NextResponse.json({
      configured: isAffiliateSheetConfigured(),
      sheetId: sheetId.slice(0, 10) + "...",
      clientEmail: creds.client_email,
      clicksTab,
      leadsTab,
      conversionsTab,
      sheetTitles,
      hasClicksTab: sheetTitles ? sheetTitles.includes(clicksTab) : null,
      hasLeadsTab: sheetTitles ? sheetTitles.includes(leadsTab) : null,
      hasConversionsTab: sheetTitles ? sheetTitles.includes(conversionsTab) : null,
      sheetFetchError,
    });
  } catch {
    return NextResponse.json({
      configured: false,
      reason: "GOOGLE_SERVICE_ACCOUNT_JSON nije validan JSON",
    });
  }
}
