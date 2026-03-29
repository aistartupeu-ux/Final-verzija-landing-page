"use client";

import { useState } from "react";

/** Poseban ulaz — samo ADMIN_LIVE_CONSOLE_SECRET; ne deli se sa arhivom. */
export default function AdminLiveLoginPage() {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          res.status === 503
            ? (data.error as string) || "Postavi ADMIN_LIVE_CONSOLE_SECRET na serveru."
            : (data.error as string) || "Pogrešan pristupni kod."
        );
        setSecret("");
        return;
      }
      window.location.assign("/admin/live");
    } catch {
      setError("Greška u konekciji.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050508",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 32,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 16,
          border: "1px solid rgba(0,212,255,0.2)",
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          Live admin konzola
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 24, lineHeight: 1.5 }}>
          Drugi kod od arhive — <strong style={{ color: "#aaa" }}>ADMIN_LIVE_CONSOLE_SECRET</strong>. Sesija 8h, stroži kolačić.
        </p>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Live pristupni kod"
          autoComplete="off"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 18px",
            fontSize: 16,
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            background: "rgba(0,0,0,0.3)",
            color: "#fff",
            marginBottom: 16,
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16, lineHeight: 1.45 }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 20px",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            borderRadius: 10,
            background: "rgba(0,212,255,0.25)",
            color: "#00d4ff",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 12,
          }}
        >
          {loading ? "Prijava..." : "Prijavi se (live)"}
        </button>
        <p style={{ fontSize: 12, color: "#555", textAlign: "center" }}>
          Zamrznut prikaz (arhiva) koristi <a href="/admin/login" style={{ color: "#64748b" }}>/admin/login</a>
        </p>
      </form>
    </div>
  );
}
