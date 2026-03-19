/**
 * Dozvoljeni email domeni za form submit.
 * Samo oví provajderi su prihvaćeni: Gmail, Outlook, Yahoo, iCloud, AOL, itd.
 */
const ALLOWED_DOMAINS = [
  "@gmail.com",
  "@hotmail.com",
  "@yahoo.com",
  "@icloud.com",
  "@outlook.com",
  "@msn.com",
  "@live.com",
  "@me.com",
  "@mac.com",
  "@aol.com",
  "@mail.com",
] as const;

/** Proveri da li email završava jednim od dozvoljenih domena (case-insensitive). */
export function isAllowedEmailDomain(email: string): boolean {
  const normalized = String(email).trim().toLowerCase();
  if (!normalized.includes("@")) return false;
  return ALLOWED_DOMAINS.some((d) => normalized.endsWith(d));
}

export const EMAIL_DOMAIN_ERROR =
  "Koristite email sa dozvoljenog provajdera (npr. Gmail, Outlook, Yahoo, iCloud, AOL).";
