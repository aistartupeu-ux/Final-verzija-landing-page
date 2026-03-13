/**
 * GET /api/leads/sheet-status — provera da li je direktan Sheet upis podešen.
 * Koristi za debug (npr. otvori u browseru).
 */
import { NextResponse } from "next/server";

export async function GET() {
  const sheetId = process.env.LEADS_SHEET_ID;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!sheetId) {
    return NextResponse.json({
      configured: false,
      reason: "LEADS_SHEET_ID env nije postavljen",
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
      configured: true,
      sheetId: sheetId.slice(0, 10) + "...",
      clientEmail: creds.client_email,
    });
  } catch {
    return NextResponse.json({
      configured: false,
      reason: "GOOGLE_SERVICE_ACCOUNT_JSON nije validan JSON",
    });
  }
}
