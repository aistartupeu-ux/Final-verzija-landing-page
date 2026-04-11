/**
 * Javni waitlist broj: WAITLIST_DISPLAY_BASE (default 9000) + leadovi u `leads` sa created_at >= cutoff.
 *
 * - `WAITLIST_COUNT_SINCE_ISO` (server env) — eksplicitni ISO datum; nadjačava default.
 * - `WAITLIST_COUNT_ALL_LEADS=1` — broji sve redove u `leads` (staro ponašanje, bez cutoff-a).
 *
 * Bez env-a: broji od početka giveaway perioda (april 2026, Beograd), da se na sajtu ne sabiraju
 * stari istorijski leadovi — ostaje ~9000 + novi koji ostave mail.
 */
export const WAITLIST_DEFAULT_COUNT_SINCE_ISO = "2026-04-02T00:00:00+02:00";
