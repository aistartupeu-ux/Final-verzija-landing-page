"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";

export default function AffiliateLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/affiliate/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Greška pri prijavi");
        return;
      }

      localStorage.setItem("ayhype_affiliate", JSON.stringify(data.affiliate));
      router.push("/affiliate/dashboard");
    } catch {
      setError("Greška pri povezivanju sa serverom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <style>{`
        .aff-input{width:100%;padding:14px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#fff;font-size:14px;outline:none;transition:border-color .2s;box-sizing:border-box}
        .aff-input:focus{border-color:rgba(0,212,255,0.4)}
        .aff-input::placeholder{color:#444}
        .aff-label{font-size:12px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;display:block}
        .aff-submit{width:100%;padding:15px;border-radius:14px;font-size:15px;font-weight:700;background:linear-gradient(135deg,#00d4ff,#8b5cf6);color:#fff;border:none;cursor:pointer;transition:opacity .2s,transform .2s;display:flex;align-items:center;justify-content:center;gap:8px}
        .aff-submit:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
        .aff-submit:disabled{opacity:.5;cursor:not-allowed}
      `}</style>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link href="/affiliate" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={17} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800 }}>AI <span style={{ color: "#00d4ff" }}>HYPE</span></span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 20, marginBottom: 8 }}>Prijavi se</h1>
          <p style={{ fontSize: 14, color: "#666" }}>Upravljaj svojim affiliate nalogom</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 22, padding: "36px 32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="aff-label">Email adresa</label>
              <input
                className="aff-input"
                type="email"
                placeholder="marko@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="aff-label">Lozinka</label>
              <div style={{ position: "relative" }}>
                <input
                  className="aff-input"
                  type={showPass ? "text" : "password"}
                  placeholder="Tvoja lozinka"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4 }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#ef4444", fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="aff-submit" disabled={loading}>
              {loading ? "Prijavljujem..." : <><span>Prijavi se</span> <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#555" }}>
          Nemaš nalog?{" "}
          <Link href="/affiliate/register" style={{ color: "#00d4ff", textDecoration: "none", fontWeight: 600 }}>
            Registruj se besplatno
          </Link>
        </div>
      </div>
    </div>
  );
}
