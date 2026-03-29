/** Sat i sekunde do ponoći u Europe/Belgrade (klijent, za stari admin bez API osvežavanja sata). */
export function getBelgradeTimeAndCountdown(): { belgradeTime: string; secondsUntilMidnight: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Belgrade",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  const s = parts.find((p) => p.type === "second")?.value ?? "00";
  const H = parseInt(h, 10);
  const M = parseInt(m, 10);
  const S = parseInt(s, 10);
  const elapsed = H * 3600 + M * 60 + S;
  const secondsUntilMidnight = 86400 - elapsed;
  return {
    belgradeTime: `${h}:${m}:${s} (Beograd)`,
    secondsUntilMidnight,
  };
}
