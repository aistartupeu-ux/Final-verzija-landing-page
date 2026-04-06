/** Opcije foruma na thank-you — moraju se poklapati sa /api/leads/phone validacijom. */

export const THANK_YOU_SURVEY_Q1_OPTIONS = [
  "Kreiranje sadržaja",
  "Automatizacija biznisa",
  "Više prodaje i leadova",
  "Produktivnost i ušteda vremena",
  "Još istražujem",
] as const;

export const THANK_YOU_SURVEY_Q3_OPTIONS = [
  "Nemam jasan sistem",
  "Nemam vremena",
  "Nemam znanja",
  "Nemam ideju odakle da počnem",
  "Ne znam šta zapravo funkcioniše",
] as const;

export const THANK_YOU_SURVEY_Q4_OPTIONS = [
  "Da, što pre",
  "Verovatno da",
  "Možda",
  "Samo razgledam",
] as const;

export const THANK_YOU_SURVEY_Q5_OPTIONS = [
  "Freelancer",
  "Preduzetnik",
  "Zaposlen",
  "Kreator sadržaja",
  "Student",
  "Nešto drugo",
] as const;

export const THANK_YOU_SURVEY_Q2_MIN = 3;
export const THANK_YOU_SURVEY_Q2_MAX = 800;

export type ThankYouSurveyQ1 = (typeof THANK_YOU_SURVEY_Q1_OPTIONS)[number];
export type ThankYouSurveyQ3 = (typeof THANK_YOU_SURVEY_Q3_OPTIONS)[number];
export type ThankYouSurveyQ4 = (typeof THANK_YOU_SURVEY_Q4_OPTIONS)[number];
export type ThankYouSurveyQ5 = (typeof THANK_YOU_SURVEY_Q5_OPTIONS)[number];

export const THANK_YOU_SURVEY_LABELS = {
  q1: "Šta te trenutno najviše zanima kod AI-ja?",
  q2: "Koji je tvoj najveći cilj u narednih 6 meseci?",
  q3: "Šta te trenutno najviše koči?",
  q4: "Ako ti na eventu pokažemo jasan sistem, da li bi želeo da ga primeniš?",
  q5: "Čime se baviš?",
} as const;

export function normalizeSurveyGoal(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().replace(/\s+/g, " ");
  if (t.length < THANK_YOU_SURVEY_Q2_MIN || t.length > THANK_YOU_SURVEY_Q2_MAX) return null;
  return t;
}
