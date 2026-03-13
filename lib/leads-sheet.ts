/**
 * Direktan upis u Google Sheet "Leads by Source".
 * Alternativa Make webhooku — radi bez Make.com.
 *
 * Setup:
 * 1. Google Cloud Console → Service Account → JSON key
 * 2. Share Sheet sa service account email (Editor)
 * 3. Env: LEADS_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON (ceo JSON kao string)
 */

import { google } from "googleapis";

export type LeadsSourceRow = {
  date: string;
  email: string;
  phone: string;
  name: string;
  source_tag: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  affiliate_code: string;
};

export async function appendLeadsToSheet(row: LeadsSourceRow): Promise<boolean> {
  const sheetId = process.env.LEADS_SHEET_ID;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!sheetId || !json) {
    if (!sheetId) console.error("Leads Sheet: LEADS_SHEET_ID env nije postavljen");
    if (!json) console.error("Leads Sheet: GOOGLE_SERVICE_ACCOUNT_JSON env nije postavljen");
    return false;
  }

  try {
    const creds = JSON.parse(json) as { client_email?: string; private_key?: string };
    if (!creds.client_email || !creds.private_key) {
      console.error("Leads Sheet: missing client_email or private_key in JSON");
      return false;
    }
    // Vercel env može da zameni \n sa pravim newline — vrati ako treba
    const privateKey = String(creds.private_key).replace(/\\n/g, "\n");
    const credentials = { ...creds, private_key: privateKey };

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const values = [
      [
        row.date,
        row.email,
        row.phone,
        row.name,
        row.source_tag,
        row.utm_source,
        row.utm_medium,
        row.utm_campaign,
        row.affiliate_code,
      ],
    ];

    let sheetName = process.env.LEADS_SHEET_NAME;
    if (!sheetName) {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const firstSheet = meta.data.sheets?.[0]?.properties?.title;
      sheetName = firstSheet || "Sheet1";
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
    const err = e as { message?: string; code?: number };
    console.error("Leads Sheet append error:", err?.message || err, err);
    return false;
  }
}
