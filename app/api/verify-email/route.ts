import { NextRequest, NextResponse } from "next/server";
import { isAllowedEmailDomain } from "@/lib/email-domains";
import { hasValidMxRecords } from "@/lib/email-verify-server";

/**
 * Abstract API za deliverability. Podržava oba:
 * - Email Validation API (emailvalidation.abstractapi.com)
 * - Email Reputation API (emailreputation.abstractapi.com)
 */
async function checkAbstractApi(email: string): Promise<{
  valid: boolean;
  message?: string;
}> {
  const key = process.env.ABSTRACT_EMAIL_API_KEY;
  if (!key) return { valid: true };

  // 1) Pokušaj Email Reputation API (status: deliverable | undeliverable | unknown)
  try {
    const repUrl = `https://emailreputation.abstractapi.com/v1/?api_key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`;
    const repRes = await fetch(repUrl, { next: { revalidate: 0 } });
    if (repRes.ok) {
      const data = await repRes.json();
      const status = data?.email_deliverability?.status;
      if (status === "undeliverable") {
        const detail = data?.email_deliverability?.status_detail || "";
        return {
          valid: false,
          message: detail === "invalid_mailbox"
            ? "Email adresa ne postoji ili nije isporučiva."
            : "Email adresa nije isporučiva.",
        };
      }
      return { valid: true };
    }
    if (repRes.status === 401) {
      // Ključ nije za Reputation, pokušaj Validation
    } else {
      return { valid: true };
    }
  } catch {
    // Fallback na Validation
  }

  // 2) Pokušaj Email Validation API (deliverability: DELIVERABLE | UNDELIVERABLE)
  try {
    const valUrl = `https://emailvalidation.abstractapi.com/v1/?api_key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`;
    const valRes = await fetch(valUrl, { next: { revalidate: 0 } });
    if (!valRes.ok) return { valid: true };

    const data = await valRes.json();
    const deliverability = data?.deliverability;
    const autocorrect = data?.autocorrect;

    if (deliverability === "UNDELIVERABLE") {
      return {
        valid: false,
        message: autocorrect
          ? `Email nije isporučiv. Da li ste mislili: ${autocorrect}?`
          : "Email adresa nije isporučiva ili ne postoji.",
      };
    }
    return { valid: true };
  } catch {
    return { valid: true };
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return NextResponse.json({
      valid: false,
      reason: "format",
      message: "Neispravan format email adrese.",
    });
  }

  if (!isAllowedEmailDomain(trimmed)) {
    return NextResponse.json({
      valid: false,
      reason: "domain",
      message: "Koristite email sa dozvoljenog provajdera (Gmail, Outlook, Yahoo, iCloud, AOL, itd.).",
    });
  }

  const [mxOk, abstractResult] = await Promise.all([
    hasValidMxRecords(trimmed),
    checkAbstractApi(trimmed),
  ]);

  if (!abstractResult.valid) {
    return NextResponse.json({
      valid: false,
      reason: "undeliverable",
      message: abstractResult.message ?? "Email adresa nije isporučiva ili ne postoji.",
    });
  }

  if (!mxOk) {
    return NextResponse.json({
      valid: false,
      reason: "mx",
      message: "Domen nema podešene mail servere. Proverite da li ste uneli ispravnu adresu.",
    });
  }

  return NextResponse.json({
    valid: true,
    message: "Email je validan.",
  });
}
