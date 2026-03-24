/** Vrednost kolačića bez lomljenja na svaki `=` u vrednosti (npr. base64 padding). */
export function getCookieFromHeader(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const pref = `${name}=`;
  for (const part of header.split(";")) {
    const t = part.trim();
    if (t.startsWith(pref)) return t.slice(pref.length);
  }
  return undefined;
}
