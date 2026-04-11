/**
 * Direktan upis u Google Sheet "Leads by Source".
 * Alternativa Make webhooku — radi bez Make.com.
 *
 * Setup:
 * 1. Google Cloud Console → Service Account → JSON key
 * 2. Share Sheet sa service account email (Editor)
 * 3. Env: LEADS_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON (ceo JSON kao string)
 * 4. Glavni tab: LEADS_SHEET_NAME (npr. Лист1). Bez env-a koristi se prvi tab koji NIJE lead-magnet tab (LM često prvi u fajlu).
 * 5. Tab LM: samo source_tag lead_magnet (čist LM). lead_magnet_affiliate i ostalo → glavni list (Лист1). GW → appendGiveawayToSheet.
 */

import { google } from "googleapis";
import { formatBelgradeDateOnly } from "@/lib/time-belgrade";
import { usesLeadMagnetSheetTab } from "@/lib/lead-source-tags";

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

export type GiveawaySheetRow = {
  date: string;
  email: string;
  phone: string;
  name: string;
  source_tag: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  affiliate_code: string;
  status: string;
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
    date: date || formatBelgradeDateOnly(),
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

type SheetsClient = ReturnType<typeof google.sheets>;

async function getSpreadsheetTabTitles(sheets: SheetsClient, spreadsheetId: string): Promise<string[]> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  return (meta.data.sheets ?? [])
    .map((s) => String(s.properties?.title ?? "").trim())
    .filter(Boolean);
}

function leadMagnetSheetTabName(): string {
  return process.env.LEAD_MAGNET_SHEET_NAME?.trim() || "LM";
}

/**
 * Glavni funnel: LEADS_SHEET_NAME ili prvi tab koji NIJE lead-magnet tab (da LM može biti levo u dokumentu).
 */
function resolveMainLeadsSheetTabName(titles: string[], envExplicit: string | undefined): string {
  const t = envExplicit?.trim();
  if (t) return t;
  const lm = leadMagnetSheetTabName().toLowerCase();
  const nonLm = titles.find((title) => title.trim().toLowerCase() !== lm);
  return nonLm ?? titles[0] ?? "Sheet1";
}

/** Samo za lead magnet (free-guide), kada je source_tag lead_magnet sa pouzdanog proxy-ja. */
function resolveLeadMagnetSheetTabName(): string {
  return leadMagnetSheetTabName();
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
    const useLmTab = usesLeadMagnetSheetTab(row.source_tag);
    // LM tab: bez affiliate kolone — affiliate ide samo u Лист1 (lead_magnet_affiliate).
    const affiliateCell = useLmTab ? "" : String(row.affiliate_code ?? "");
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
        affiliateCell,
      ],
    ];

    const titles = await getSpreadsheetTabTitles(sheets, sheetId);
    const sheetName = useLmTab
      ? resolveLeadMagnetSheetTabName()
      : resolveMainLeadsSheetTabName(titles, process.env.LEADS_SHEET_NAME);
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

/** Direktan upis u odvojeni giveaway tab (npr. "GW"). */
export async function appendGiveawayToSheet(row: GiveawaySheetRow): Promise<boolean> {
  const sheetId = process.env.GIVEAWAY_SHEET_ID || process.env.LEADS_SHEET_ID;
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!sheetId || !json) {
    if (!sheetId) console.error("Giveaway Sheet: GIVEAWAY_SHEET_ID/LEADS_SHEET_ID env nije postavljen");
    if (!json) console.error("Giveaway Sheet: GOOGLE_SERVICE_ACCOUNT_JSON env nije postavljen");
    return false;
  }

  try {
    const creds = JSON.parse(json) as { client_email?: string; private_key?: string };
    if (!creds.client_email || !creds.private_key) {
      console.error("Giveaway Sheet: missing client_email or private_key in JSON");
      return false;
    }
    const privateKey = String(creds.private_key).replace(/\\n/g, "\n");
    const credentials = { ...creds, private_key: privateKey };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const sheetName = process.env.GIVEAWAY_SHEET_NAME || "GW";
    const values = [[
      row.date,
      row.email,
      row.phone,
      row.name,
      row.source_tag,
      row.utm_source,
      row.utm_medium,
      row.utm_campaign,
      row.affiliate_code,
      row.status,
    ]];
    const range = `'${sheetName}'!A:J`;
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
    console.error("Giveaway Sheet append error:", err?.message ?? e);
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
    const titles = await getSpreadsheetTabTitles(sheets, sheetId);
    const sheetName = resolveMainLeadsSheetTabName(titles, process.env.LEADS_SHEET_NAME);
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

export type LeadsSheetPhoneExtras = {
  ai_experience?: string;
  survey_q1?: string;
  survey_q2?: string;
  survey_q3?: string;
  survey_q4?: string;
  survey_q5?: string;
};

const LEADS_SHEET_EXTRAS_HEADERS = [
  "ai_experience",
  "survey_q1_interest",
  "survey_q2_goal",
  "survey_q3_blocker",
  "survey_q4_system_apply",
  "survey_q5_occupation",
] as const;

/**
 * Ažurira jedan tab: kolona C (telefon), opciono D (ime); J–O ekstra polja.
 * Traži odozgo; prvi email match.
 */
async function updateLeadsSheetPhoneInTab(
  sheets: SheetsClient,
  sheetId: string,
  sheetName: string,
  emailNorm: string,
  phoneVal: string,
  name: string | undefined,
  extras: LeadsSheetPhoneExtras | undefined
): Promise<boolean> {
  const rangeRead = `'${sheetName}'!A2:O`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: rangeRead });
  const rows = (res.data.values ?? []) as string[][];
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${sheetName}'!A1:O1`,
  });
  const headers = (headerRes.data.values?.[0] ?? []).map((h) => String(h ?? "").trim().toLowerCase());

  const headersRead = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${sheetName}'!J1:O1`,
  });
  const existingHeaders = (headersRead.data.values?.[0] ?? []).map((x) => String(x ?? "").trim());
  const hasAllHeaders = LEADS_SHEET_EXTRAS_HEADERS.every((h, i) => existingHeaders[i] === h);
  if (!hasAllHeaders) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `'${sheetName}'!J1:O1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[...LEADS_SHEET_EXTRAS_HEADERS]] },
    });
  }

  const headerEmailIdx = headers.findIndex((h) => h === "email");
  const emailIdx = headerEmailIdx >= 0 ? headerEmailIdx : 1;
  let sheetRow = -1;
  for (let i = 0; i < rows.length; i++) {
    const cell = String(rows[i]?.[emailIdx] ?? "").trim().toLowerCase();
    if (cell === emailNorm) {
      sheetRow = i + 2;
      break;
    }
  }
  if (sheetRow < 0) return false;

  const nameTrim = typeof name === "string" ? name.trim() : "";
  const data: { range: string; values: string[][] }[] = [
    { range: `'${sheetName}'!C${sheetRow}`, values: [[phoneVal]] },
  ];
  if (nameTrim) {
    data.push({ range: `'${sheetName}'!D${sheetRow}`, values: [[nameTrim]] });
  }
  const x = extras;
  if (x) {
    const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);
    if (x.ai_experience?.trim()) {
      data.push({ range: `'${sheetName}'!J${sheetRow}`, values: [[clip(x.ai_experience.trim(), 500)]] });
    }
    if (x.survey_q1?.trim()) {
      data.push({ range: `'${sheetName}'!K${sheetRow}`, values: [[clip(x.survey_q1.trim(), 300)]] });
    }
    if (x.survey_q2?.trim()) {
      data.push({ range: `'${sheetName}'!L${sheetRow}`, values: [[clip(x.survey_q2.trim(), 1000)]] });
    }
    if (x.survey_q3?.trim()) {
      data.push({ range: `'${sheetName}'!M${sheetRow}`, values: [[clip(x.survey_q3.trim(), 300)]] });
    }
    if (x.survey_q4?.trim()) {
      data.push({ range: `'${sheetName}'!N${sheetRow}`, values: [[clip(x.survey_q4.trim(), 200)]] });
    }
    if (x.survey_q5?.trim()) {
      data.push({ range: `'${sheetName}'!O${sheetRow}`, values: [[clip(x.survey_q5.trim(), 200)]] });
    }
  }
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });
  return true;
}

/**
 * Ažurira kolonu C (telefon), opciono D (ime) za red čiji je email u koloni B — bez novog reda (Leads by Source).
 * Opciono J–O: ai_experience + anketa (dodaj zaglavlja u Sheet ako koristiš).
 * Glavni tab: LEADS_SHEET_NAME ili prvi tab koji nije LM. Thank-you: opts.sourceTag tačno lead_magnet → tab LM; affiliate LM ide u glavni list.
 * Ostali: prvo glavni tab, pa LM ako red nije nađen (stari pogrešni upisi).
 */
export async function updateLeadsSheetPhoneByEmail(
  email: string,
  phone: string,
  name?: string,
  extras?: LeadsSheetPhoneExtras,
  opts?: { sourceTag?: string }
): Promise<boolean> {
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
    const titles = await getSpreadsheetTabTitles(sheets, sheetId);
    const mainName = resolveMainLeadsSheetTabName(titles, process.env.LEADS_SHEET_NAME);
    const lmName = resolveLeadMagnetSheetTabName();

    const tag = String(opts?.sourceTag ?? "").trim().toLowerCase();
    if (usesLeadMagnetSheetTab(tag)) {
      return updateLeadsSheetPhoneInTab(sheets, sheetId, lmName, emailNorm, phoneVal, name, extras);
    }

    const okMain = await updateLeadsSheetPhoneInTab(sheets, sheetId, mainName, emailNorm, phoneVal, name, extras);
    if (okMain) return true;
    if (lmName !== mainName && titles.includes(lmName)) {
      return updateLeadsSheetPhoneInTab(sheets, sheetId, lmName, emailNorm, phoneVal, name, extras);
    }
    return false;
  } catch (e) {
    const err = e as { message?: string };
    console.error("Leads Sheet update phone error:", err?.message ?? e);
    return false;
  }
}
