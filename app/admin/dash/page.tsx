"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AdminDashErrorPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: 420,
      }}>
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          Stranica nije dostupna
        </h1>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.5 }}>
          Ova adresa više nije u upotrebi. Pristup je onemogućen.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.08)",
            color: "#00d4ff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Nazad na početnu
        </Link>
      </div>
    </div>
  );
}
