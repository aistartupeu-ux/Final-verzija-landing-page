/**
 * Direktan upis u Google Sheet samo za affiliate (Clicks + Leads).
 * Bez Make — isti Service Account kao za leads, drugi spreadsheet.
 *
 * Setup:
 * 1. Google Sheet samo za affiliate (npr. "AHA_Affiliate_System") — tabovi "Clicks" i "Leads"
 * 2. Share Sheet sa service account email (Editor) — isti kao za LEADS_SHEET_ID ili drugi
 * 3. Env: AFFILIATE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON (može isti kao za leads)
 */

import { google } from "googleapis";

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;
  try {
    const creds = JSON.parse(json) as { client_email?: string; private_key?: string };
    if (!creds.client_email || !creds.private_key) return null;
    const privateKey = String(creds.private_key).replace(/\\n/g, "\n");
    const auth = new google.auth.GoogleAuth({
      credentials: { ...creds, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return auth;
  } catch {
    return null;
  }
}

export type AffiliateClickRow = {
  clicked_at: string;
  affiliate_code: string;
  visitor_id: string;
  page_url: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
};

export type AffiliateLeadRow = {
  created_at: string;
  email: string;
  phone: string | null;
  affiliate_code: string;
  visitor_id: string | null;
  page_url: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  status: string;
};

export type AffiliateConversionRow = {
  created_at: string;
  email: string;
  phone: string | null;
  affiliate_code: string;
  order_amount: number;
  currency: string;
  order_id: string | null;
  conversion_type: string;
  commission_rate: number | null;
  commission_amount: number | null;
  status: string;
};

export async function appendAffiliateClickToSheet(row: AffiliateClickRow): Promise<boolean> {
  const sheetId = process.env.AFFILIATE_SHEET_ID;
  if (!sheetId) {
    console.error("Affiliate Sheet: AFFILIATE_SHEET_ID nije postavljen");
    return false;
  }
  const auth = getAuth();
  if (!auth) {
    console.error("Affiliate Sheet: GOOGLE_SERVICE_ACCOUNT_JSON nije ispravan");
    return false;
  }

  const sheetName = process.env.AFFILIATE_SHEET_CLICKS_NAME || "Clicks";
  const values = [[
    row.clicked_at,
    row.affiliate_code,
    row.visitor_id,
    row.page_url ?? "",
    row.utm_source ?? "",
    row.utm_campaign ?? "",
  ]];

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const hasClicks = meta.data.sheets?.some((s) => s.properties?.title === sheetName);
    if (!hasClicks) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
    }
    const range = `'${sheetName}'!A:F`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
    return true;
  } catch (e) {
    const err = e as { message?: string };
    console.error("Affiliate Sheet Clicks error:", err?.message || e);
    return false;
  }
}

export async function appendAffiliateLeadToSheet(row: AffiliateLeadRow): Promise<boolean> {
  const sheetId = process.env.AFFILIATE_SHEET_ID;
  if (!sheetId) {
    console.error("Affiliate Sheet: AFFILIATE_SHEET_ID nije postavljen");
    return false;
  }
  const auth = getAuth();
  if (!auth) {
    console.error("Affiliate Sheet: GOOGLE_SERVICE_ACCOUNT_JSON nije ispravan");
    return false;
  }

  const sheetName = process.env.AFFILIATE_SHEET_LEADS_NAME || "Leads";
  const values = [[
    row.created_at,
    row.email,
    row.phone ?? "",
    row.affiliate_code,
    row.visitor_id ?? "",
    row.page_url ?? "",
    row.utm_source ?? "",
    row.utm_campaign ?? "",
    row.status,
  ]];

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const hasLeads = meta.data.sheets?.some((s) => s.properties?.title === sheetName);
    if (!hasLeads) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
    }
    const range = `'${sheetName}'!A:I`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
    return true;
  } catch (e) {
    const err = e as { message?: string };
    console.error("Affiliate Sheet Leads error:", err?.message || e);
    return false;
  }
}

export async function appendAffiliateConversionToSheet(row: AffiliateConversionRow): Promise<boolean> {
  const sheetId = process.env.AFFILIATE_SHEET_ID;
  if (!sheetId) {
    console.error("Affiliate Sheet: AFFILIATE_SHEET_ID nije postavljen");
    return false;
  }
  const auth = getAuth();
  if (!auth) {
    console.error("Affiliate Sheet: GOOGLE_SERVICE_ACCOUNT_JSON nije ispravan");
    return false;
  }

  const sheetName = process.env.AFFILIATE_SHEET_CONVERSIONS_NAME || "Conversions";
  const values = [[
    row.created_at,
    row.email,
    row.phone ?? "",
    row.affiliate_code,
    row.order_amount,
    row.currency,
    row.order_id ?? "",
    row.conversion_type,
    row.commission_rate ?? "",
    row.commission_amount ?? "",
    row.status,
  ]];

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const hasSheet = meta.data.sheets?.some((s) => s.properties?.title === sheetName);
    if (!hasSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
    }
    const range = `'${sheetName}'!A:K`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
    return true;
  } catch (e) {
    const err = e as { message?: string };
    console.error("Affiliate Sheet Conversions error:", err?.message || e);
    return false;
  }
}

/** Da li je direktan upis u Affiliate Sheet podešen (može raditi bez Make). */
export function isAffiliateSheetConfigured(): boolean {
  return !!(process.env.AFFILIATE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}
