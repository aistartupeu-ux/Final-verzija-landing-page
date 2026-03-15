"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Gift, Check } from "lucide-react";
import { initAffiliateTracking, trackAffiliateLeadOnSubmit, getLeadSourceData } from "@/lib/affiliate-tracking";
import NetworkBackground from "@/components/ui/NetworkBackground";

function SpecialGateContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");

  useEffect(() => {
    initAffiliateTracking();
  }, [searchParams]);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Redirect posle submita isključen za demo na localhostu. Da uključiš: REDIRECT_AFTER_SUBMIT = true
  const REDIRECT_AFTER_SUBMIT = false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setError(null);
    setLoading(true);
    try {
      const sourceData = getLeadSourceData();
      const res = await fetch("/api/special/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: phone.trim() || null,
          utm_source: sourceData.utm_source,
          utm_medium: sourceData.utm_medium,
          utm_campaign: sourceData.utm_campaign,
          affiliate_code: sourceData.affiliate_code,
          source_tag: sourceData.source_tag,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Greška pri prijavi");
      }
      trackAffiliateLeadOnSubmit({ email, phone: phone.trim() || null });
      if (REDIRECT_AFTER_SUBMIT) {
        window.location.href = "/special/offer";
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => ({
    width: "100%",
    padding: "14px 18px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${focused === field ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
    outline: "none",
    color: "#fff",
    fontSize: 15,
    fontFamily: "inherit",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    boxShadow: focused === field ? "0 0 20px rgba(0,212,255,0.06)" : "none",
  });

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <NetworkBackground />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 24px 60px",
        }}
      >
        <div style={{ maxWidth: 480, width: "100%" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#666",
              textDecoration: "none",
              fontSize: 13,
              marginBottom: 32,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00d4ff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
          >
            <ArrowLeft size={14} /> Nazad
          </Link>

          <div
            style={{
              padding: "40px 32px",
              borderRadius: 28,
              position: "relative",
              overflow: "hidden",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(0,212,255,0.1)",
              boxShadow:
                "0 8px 60px rgba(0,0,0,0.4), 0 0 80px rgba(0,212,255,0.03)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "linear-gradient(90deg, #00d4ff, #7c3aed, #ec4899)",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Gift size={24} color="#00d4ff" />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#00d4ff",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Special Offer
              </span>
            </div>

            {submitted ? (
              <>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <Check size={28} color="#22c55e" />
                </div>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    textAlign: "center",
                    marginBottom: 8,
                    color: "#fff",
                  }}
                >
                  Uspešno!
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    color: "#888",
                    textAlign: "center",
                    lineHeight: 1.6,
                  }}
                >
                  Hvala. Tvoji podaci su sačuvani.
                </p>
              </>
            ) : (
              <>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Otključaj ekskluzivnu ponudu
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#888",
                textAlign: "center",
                marginBottom: 28,
                lineHeight: 1.6,
              }}
            >
              Unesi email i telefon da vidiš šta smo pripremili za tebe.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "#777",
                    fontWeight: 500,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  placeholder="tvoj@email.com"
                  required
                  style={inputStyle("email")}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "#777",
                    fontWeight: 500,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Telefon (opciono)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused("")}
                  placeholder="+381..."
                  style={inputStyle("phone")}
                />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="glow-btn"
                style={{
                  width: "100%",
                  borderRadius: 14,
                  marginTop: 8,
                  fontSize: 14,
                }}
              >
                {loading ? (
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <>
                    Join the Hype <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpecialGatePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>...</div>}>
      <SpecialGateContent />
    </Suspense>
  );
}
