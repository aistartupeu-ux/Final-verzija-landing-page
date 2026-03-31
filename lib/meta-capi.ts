import crypto from "node:crypto";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function norm(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const v = input.trim().toLowerCase();
  return v.length ? v : null;
}

export type MetaCapiResult = {
  ok: boolean;
  status: number;
  eventsReceived?: number;
  errorMessage?: string;
};

export async function sendMetaCapiLeadEvent(opts: {
  email: string;
  phone?: string | null;
  ip: string | null;
  userAgent: string | null;
  eventSourceUrl: string | null;
  fbp?: string | null;
  fbc?: string | null;
  event_id?: string | null;
}): Promise<MetaCapiResult> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE || null;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "2347723352398323";
  if (!accessToken || !pixelId) {
    return {
      ok: false,
      status: 503,
      errorMessage: "META_CAPI_ACCESS_TOKEN or NEXT_PUBLIC_META_PIXEL_ID missing",
    };
  }

  const em = norm(opts.email);
  const ph = norm(opts.phone ?? null);

  if (!em && !ph) {
    return {
      ok: false,
      status: 400,
      errorMessage: "Missing user_data: email/phone",
    };
  }

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: opts.event_id ?? undefined,
        event_source_url: opts.eventSourceUrl ?? undefined,
        user_data: {
          em: em ? [sha256(em)] : undefined,
          ph: ph ? [sha256(ph.replace(/[^\d+]/g, ""))] : undefined,
          client_ip_address: opts.ip ?? undefined,
          client_user_agent: opts.userAgent ?? undefined,
          fbp: opts.fbp ?? undefined,
          fbc: opts.fbc ?? undefined,
        },
      },
    ],
    test_event_code: testEventCode || undefined,
  };

  const url = `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 4_000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timeoutId);
    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      error?: { message?: string };
    };

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        errorMessage: json?.error?.message ?? `Meta CAPI HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      eventsReceived: json?.events_received,
    };
  } catch (e) {
    console.error("Meta CAPI error:", e);
    return {
      ok: false,
      status: 500,
      errorMessage: e instanceof Error ? e.message : "Unknown Meta CAPI error",
    };
  }
}
