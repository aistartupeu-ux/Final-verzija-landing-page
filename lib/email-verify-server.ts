import { promises as dns } from "dns";

/** Proveri da li domen ima MX zapise (može primati email). Samo za server-side. */
export async function hasValidMxRecords(email: string): Promise<boolean> {
  const parts = String(email).trim().toLowerCase().split("@");
  const domain = parts.length === 2 ? parts[1] : null;
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}
