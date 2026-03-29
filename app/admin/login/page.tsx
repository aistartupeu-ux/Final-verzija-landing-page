"use client";

import { useState } from "react";
import { ADMIN_ANALYTICS_LIVE_PATH } from "@/lib/admin-routes";

export default function AdminLoginPage() {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "Not configured"
            ? "Server nema ADMIN_ANALYTICS_SECRET (.env.local / Vercel)."
            : data.error || "Pogrešan pristupni kod."
        );
        setSecret("");
        return;
      }
      // Pun document load da browser sigurno pošalje HttpOnly kolačić u middleware
      window.location.assign(ADMIN_ANALYTICS_LIVE_PATH);
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
          maxWidth: 360,
          padding: 32,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          Admin pristup
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
          Unesi pristupni kod
        </p>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Pristupni kod"
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
          <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 16 }}>{error}</p>
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
            background: "rgba(0,212,255,0.2)",
            color: "#00d4ff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Prijava..." : "Prijavi se"}
        </button>
      </form>
    </div>
  );
}
