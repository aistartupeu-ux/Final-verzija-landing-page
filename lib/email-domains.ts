/**
 * Provera osnovnog formata email adrese (uključujući poslovne domene).
 * Nema whitelist provajdera — bilo koji domen sa tačkom u delu posle @ je dozvoljen.
 */

/** Jednostavna provera: local@domain.tld (domen mora imati bar jednu tačku). */
export function isAllowedEmailDomain(email: string): boolean {
  const normalized = String(email).trim();
  if (!normalized.includes("@")) return false;
  const parts = normalized.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (domain.includes(" ") || local.startsWith(".") || local.endsWith(".")) return false;
  // FQDN: bar jedna tačka u domenu (npr. firma.rs, mail.company.co.uk)
  if (!domain.includes(".")) return false;
  const labels = domain.split(".");
  if (labels.some((l) => !l || l.length > 63)) return false;
  return true;
}

export const EMAIL_DOMAIN_ERROR = "Unesite ispravnu email adresu (npr. ime@firma.com).";

export const EMAIL_MX_ERROR =
  "Email adresa nije validna ili domen nema podešene mail servere.";
