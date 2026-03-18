"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Link2, TrendingUp, Wallet, LogOut, Menu, X, Sparkles, Users } from "lucide-react";

const navItems = [
  { href: "/affiliate/dashboard", icon: LayoutDashboard, label: "Pregled", exact: true },
  { href: "/affiliate/dashboard/links", icon: Link2, label: "Moj Link" },
  { href: "/affiliate/dashboard/earnings", icon: TrendingUp, label: "Zarade" },
  { href: "/affiliate/dashboard/payouts", icon: Wallet, label: "Isplate" },
];

export default function AffiliateDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [affiliateName] = useState(() => {
    if (typeof window === "undefined") return "Partner";
    const stored = localStorage.getItem("ayhype_affiliate");
    if (!stored) return "Partner";
    try {
      const aff = JSON.parse(stored) as { name?: string };
      return aff.name ?? "Partner";
    } catch {
      return "Partner";
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem("ayhype_affiliate");
    if (!stored) {
      router.push("/affiliate/login");
      return;
    }
    try {
      JSON.parse(stored);
    } catch {
      router.push("/affiliate/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("ayhype_affiliate");
    router.push("/affiliate/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff" }}>
      <style>{`
        .aff-sb{position:fixed;top:0;left:0;bottom:0;width:250px;background:rgba(8,8,14,0.97);border-right:1px solid rgba(255,255,255,0.04);z-index:90;display:flex;flex-direction:column;transition:transform .3s ease}
        .aff-content{margin-left:250px;min-height:100vh}
        .aff-mobile-bar{display:none}
        .aff-overlay{display:none}
        @media(max-width:899px){
          .aff-sb{transform:translateX(-100%)}
          .aff-sb.open{transform:translateX(0)}
          .aff-content{margin-left:0}
          .aff-mobile-bar{display:flex}
          .aff-overlay{display:block}
        }
      `}</style>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="aff-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 89 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`aff-sb${sidebarOpen ? " open" : ""}`}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <Link href="/affiliate" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>AI <span style={{ color: "#00d4ff" }}>HYPE</span></div>
              <div style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: "0.15em" }}>Affiliate</div>
            </div>
          </Link>
        </div>

        <div style={{ padding: "16px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,rgba(0,212,255,0.15),rgba(139,92,246,0.15))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="#00d4ff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{affiliateName}</div>
              <div style={{ fontSize: 10, color: "#00d4ff", fontWeight: 600 }}>Affiliate Partner</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {navItems.map((item, i) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={i}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "10px 14px",
                  borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "#666",
                  background: active ? "rgba(0,212,255,0.06)" : "transparent",
                  borderLeft: `2px solid ${active ? "#00d4ff" : "transparent"}`,
                  transition: "all .2s",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; } }}
              >
                <Icon size={16} color={active ? "#00d4ff" : "#444"} strokeWidth={active ? 2 : 1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", width: "100%",
              borderRadius: 12, fontSize: 13, color: "#555", background: "none", border: "none", cursor: "pointer", transition: "color .2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555")}
          >
            <LogOut size={16} /> Odjavi se
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="aff-content">
        {/* Mobile topbar */}
        <div className="aff-mobile-bar" style={{
          padding: "14px 20px", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(8,8,14,0.95)",
          backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 80,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800 }}>AI <span style={{ color: "#00d4ff" }}>HYPE</span> <span style={{ color: "#444", fontSize: 10 }}>Affiliate</span></span>
          </div>
          <button
            onClick={() => setSidebarOpen(s => !s)}
            style={{ background: "none", border: "none", color: "#777", cursor: "pointer", padding: 4 }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div style={{ padding: "36px 32px 56px", maxWidth: 1050 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
