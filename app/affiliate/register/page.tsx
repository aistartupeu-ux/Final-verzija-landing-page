"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, CheckCircle, Sparkles } from "lucide-react";

export default function AffiliateRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", payoutEmail: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          payoutEmail: form.payoutEmail || form.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Greška pri registraciji");
        return;
      }

      localStorage.setItem("ayhype_affiliate", JSON.stringify(data.affiliate));
      setSuccess(true);
      setTimeout(() => router.push("/affiliate/dashboard"), 1500);
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

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link href="/affiliate" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={17} color="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800 }}>AI <span style={{ color: "#00d4ff" }}>HYPE</span></span>
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 20, marginBottom: 8 }}>Postani Affiliate Partner</h1>
          <p style={{ fontSize: 14, color: "#666" }}>Registruj se i počni da zaraduješ odmah</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 22, padding: "36px 32px" }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Registracija uspešna!</div>
              <div style={{ fontSize: 14, color: "#666" }}>Preusmeravam te na dashboard...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label className="aff-label">Ime i prezime</label>
                <input
                  className="aff-input"
                  type="text"
                  placeholder="Marko Petrović"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

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
                    placeholder="Minimum 6 karaktera"
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

              <div>
                <label className="aff-label">Email za isplate (opciono)</label>
                <input
                  className="aff-input"
                  type="email"
                  placeholder="Ostavite prazno ako je isti kao gore"
                  value={form.payoutEmail}
                  onChange={e => setForm(f => ({ ...f, payoutEmail: e.target.value }))}
                />
              </div>

              {error && (
                <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#ef4444", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button type="submit" className="aff-submit" disabled={loading}>
                {loading ? "Registrujem..." : <><span>Registruj se besplatno</span> <ArrowRight size={16} /></>}
              </button>

              <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6, textAlign: "center" }}>
                Registracijom prihvataš uslove affiliate programa. Komisija iznosi 30% od svake prodaje.
              </div>
            </form>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#555" }}>
          Već imaš nalog?{" "}
          <Link href="/affiliate/login" style={{ color: "#00d4ff", textDecoration: "none", fontWeight: 600 }}>
            Prijavi se
          </Link>
        </div>
      </div>
    </div>
  );
}
