/** Istekstirane opcije — moraju se poklapati sa /api/leads/phone validacijom. */
export const THANK_YOU_AI_EXPERIENCE_OPTIONS = [
  "Nisam uopšte upoznat",
  "Znam osnovno, ali još nisam ozbiljno koristio AI",
  "Koristio sam neke AI alate, ali bez konkretnog sistema",
  "Već koristim AI povremeno za sadržaj ili posao",
  "Redovno koristim AI i želim to da podignem na viši nivo",
  "Već imam iskustva i hoću bolji sistem i monetizaciju",
] as const;

export type ThankYouAiExport = (typeof THANK_YOU_AI_EXPERIENCE_OPTIONS)[number];
