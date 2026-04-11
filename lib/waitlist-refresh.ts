/** CustomEvent posle uspešnog upisa u `leads` — waitlist brojač na sajtu odmah osvežava. */
export const WAITLIST_REFRESH_EVENT = "aha-waitlist-refresh";

export function broadcastWaitlistRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WAITLIST_REFRESH_EVENT));
}
