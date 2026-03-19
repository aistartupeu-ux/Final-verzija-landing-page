import { NextRequest, NextResponse } from "next/server";
import { isAllowedEmailDomain } from "@/lib/email-domains";
import { hasValidMxRecords } from "@/lib/email-verify-server";

/** Opciono: Abstract API za deliverability (kada je API key setovan). */
async function checkAbstractApi(email: string): Promise<{
  valid: boolean;
  deliverability?: string;
  autocorrect?: string;
}> {
  const key = process.env.ABSTRACT_EMAIL_API_KEY;
  if (!key) return { valid: true }; // Preskoči ako nema ključa

  try {
    const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return { valid: true }; // Na grešku ne blokiramo

    const data = await res.json();
    const deliverability = data?.deliverability;
    const autocorrect = data?.autocorrect;

    // DELIVERABLE = ok, UNDELIVERABLE = odbij, UNKNOWN = prihvati (da ne blokiramo lažno)
    if (deliverability === "UNDELIVERABLE") {
      return {
        valid: false,
        deliverability,
        autocorrect: autocorrect || undefined,
      };
    }
    return { valid: true, deliverability, autocorrect };
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
      message: abstractResult.autocorrect
        ? `Email nije isporučiv. Da li ste mislili: ${abstractResult.autocorrect}?`
        : "Email adresa nije isporučiva ili ne postoji.",
      autocorrect: abstractResult.autocorrect,
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
