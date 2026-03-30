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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}/;
const DATE_DMY = /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/; // DD.MM.YYYY, DD-MM-YYYY

function looksLikeEmail(s: string): boolean {
  return EMAIL_RE.test(String(s).trim());
}

function looksLikeDate(s: string): boolean {
  const v = String(s).trim();
  if (DATE_RE.test(v)) return true;
  // DD.MM.YYYY ili DD-MM-YYYY
  const dmy = v.match(DATE_DMY);
  if (dmy) return true;
  return false;
}

/** Parsira datum iz različitih formata u YYYY-MM-DD. */
function parseDateToIso(s: string): string {
  const v = String(s).trim();
  if (DATE_RE.test(v)) return v.slice(0, 10);
  const dmy = v.match(DATE_DMY);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }
  const parsed = new Date(v);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return v;
}

/**
 * Prepoznaje izvor iz reda.
 * Sheet: A=date, B=email, C=phone, D=name, E=source_tag, F=platforma(ig/fb/tiktok), G=utm_campaign, H=affiliate_code.
 * Prioritet: prvo platforma (tiktok/ig/fb) — affiliate+tiktok = TikTok, affiliate+ig = Instagram.
 */
function findSourceTag(cells: string[]): string {
  for (const cell of cells) {
    const v = String(cell ?? "").trim().toLowerCase();
    if (!v) continue;
    // Platformu proveravamo pre affiliate — affiliate+tiktok treba da ide u TikTok
    if (v.includes("tiktok") || v === "tt") return "tiktok";
    if (v.includes("instagram") || v === "ig" || v.startsWith("ig_")) return "instagram";
    if (v.includes("facebook") || v === "fb" || v.startsWith("fb_")) return "facebook";
    if (v.includes("affiliate")) return "affiliate";
  }
  return "direct";
}

function parseRow(cells: string[]): LeadsSourceRow | null {
  if (!cells || cells.length < 2) return null;

  let email = "";
  let date = "";
  let phone = "";

  for (let i = 0; i < cells.length; i++) {
    const v = String(cells[i] ?? "").trim();
    if (!v) continue;
    if (looksLikeEmail(v) && !email) {
      email = v;
    } else if (looksLikeDate(v) && !date) {
      date = parseDateToIso(v);
    } else if (/^\d{9,15}$/.test(v.replace(/\D/g, "")) && !phone) {
      phone = v;
    }
  }

  if (!email) return null;

  const source_tag = findSourceTag(cells);
  /**
   * appendLeadsToSheet upisuje A–I:
   * A datum, B email, C telefon, D ime, E source_tag, F utm_source, G utm_medium, H utm_campaign, I affiliate_code
   * Stari redovi (8 kolona): … F utm_source, G utm_campaign, H affiliate (bez medium kolone)
   */
  const n = cells.length;
  let utm_source = "";
  let utm_medium = "";
  let utm_campaign = "";
  let affiliate_code = "";
  if (n >= 9) {
    utm_source = String(cells[5] ?? "").trim();
    utm_medium = String(cells[6] ?? "").trim();
    utm_campaign = String(cells[7] ?? "").trim();
    affiliate_code = String(cells[8] ?? "").trim();
  } else if (n >= 8) {
    utm_source = String(cells[5] ?? "").trim();
    utm_medium = "";
    utm_campaign = String(cells[6] ?? "").trim();
    affiliate_code = String(cells[7] ?? "").trim();
  } else if (n >= 6) {
    utm_source = String(cells[5] ?? "").trim();
  }

  return {
    date: date || new Date().toISOString().slice(0, 10),
    email,
    phone,
    name: "",
    source_tag,
    utm_source,
    utm_medium,
    utm_campaign,
    affiliate_code,
  };
}

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
      sheetName = meta.data.sheets?.[0]?.properties?.title || "Sheet1";
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

/** Čita sve leadove iz Sheet-a. Podržava varijabilnu strukturu redova (form, Make, Meta Lead Ads). */
export async function getLeadsFromSheet(): Promise<LeadsSourceRow[]> {
  const sheetId = process.env.LEADS_SHEET_ID;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!sheetId || !json) return [];

  try {
    const creds = JSON.parse(json) as { client_email?: string; private_key?: string };
    if (!creds.client_email || !creds.private_key) return [];
    const privateKey = String(creds.private_key).replace(/\\n/g, "\n");
    const credentials = { ...creds, private_key: privateKey };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    let sheetName = process.env.LEADS_SHEET_NAME;
    if (!sheetName) {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      sheetName = meta.data.sheets?.[0]?.properties?.title || "Sheet1";
    }
    const range = `'${sheetName}'!A2:Z`;
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
    const rows = (res.data.values ?? []) as string[][];

    const result: LeadsSourceRow[] = [];
    for (const r of rows) {
      const parsed = parseRow(r);
      if (parsed) result.push(parsed);
    }
    return result;
  } catch (e) {
    const err = e as { message?: string };
    console.error("Leads Sheet getLeadsFromSheet error:", err?.message ?? e);
    return [];
  }
}

/**
 * Ažurira kolonu C (telefon) za red čiji je email u koloni B — bez novog reda (Leads by Source).
 * Traži odozgo; ako ima duplikata emaila, ažurira prvi pogodak.
 */
export async function updateLeadsSheetPhoneByEmail(email: string, phone: string): Promise<boolean> {
  const sheetId = process.env.LEADS_SHEET_ID;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!sheetId || !json) return false;

  const emailNorm = String(email).trim().toLowerCase();
  const phoneVal = String(phone).trim();
  if (!emailNorm || !phoneVal) return false;

  try {
    const creds = JSON.parse(json) as { client_email?: string; private_key?: string };
    if (!creds.client_email || !creds.private_key) return false;
    const privateKey = String(creds.private_key).replace(/\\n/g, "\n");
    const credentials = { ...creds, private_key: privateKey };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    let sheetName = process.env.LEADS_SHEET_NAME;
    if (!sheetName) {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      sheetName = meta.data.sheets?.[0]?.properties?.title || "Sheet1";
    }

    const rangeRead = `'${sheetName}'!A2:I`;
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: rangeRead });
    const rows = (res.data.values ?? []) as string[][];

    let sheetRow = -1;
    for (let i = 0; i < rows.length; i++) {
      const cell = String(rows[i]?.[1] ?? "").trim().toLowerCase();
      if (cell === emailNorm) {
        sheetRow = i + 2;
        break;
      }
    }
    if (sheetRow < 0) return false;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `'${sheetName}'!C${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[phoneVal]] },
    });
    return true;
  } catch (e) {
    const err = e as { message?: string };
    console.error("Leads Sheet update phone error:", err?.message ?? e);
    return false;
  }
}
