"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Wand2, Image, Film, Music, LogOut, Sparkles } from "lucide-react";

const sections = [
  { type: "item" as const, href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { type: "item" as const, href: "/dashboard", icon: GraduationCap, label: "Kurs", exact: true },
  { type: "divider" as const },
  { type: "label" as const, text: "AI Studio" },
  { type: "item" as const, href: "/dashboard/studio", icon: Wand2, label: "Svi alati", exact: true },
  { type: "item" as const, href: "/dashboard/studio/image", icon: Image, label: "Generisanje slika" },
  { type: "item" as const, href: "/dashboard/studio/video", icon: Film, label: "AI Video" },
  { type: "item" as const, href: "/dashboard/studio/music", icon: Music, label: "AI Muzika" },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 89, display: "none" }} className="sb-overlay" />}
      <aside className={`sb ${open ? "sb-open" : ""}`}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }} onClick={onClose}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #00d4ff, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>AI <span style={{ color: "#00d4ff" }}>HYPE</span></span>
              <span style={{ fontSize: 8, color: "#555", letterSpacing: "0.2em", textTransform: "uppercase", marginLeft: 4 }}>Academy</span>
            </div>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
          {sections.map((item, i) => {
            if (item.type === "divider") return <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "12px 12px" }} />;
            if (item.type === "label") return <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.14em", padding: "14px 14px 6px" }}>{item.text}</div>;

            const active = item.exact ? path === item.href : path.startsWith(item.href!);
            const Icon = item.icon!;
            return (
              <Link key={i} href={item.href!} onClick={onClose} style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 14px",
                borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? "#fff" : "#777",
                background: active ? "rgba(0,212,255,0.06)" : "transparent",
                borderLeft: active ? "2px solid #00d4ff" : "2px solid transparent",
                transition: "all 0.2s ease",
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.color = "#aaa"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#777"; } }}
              >
                <Icon size={16} color={active ? "#00d4ff" : "#555"} strokeWidth={active ? 2 : 1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "14px 10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: 11, padding: "10px 14px",
            borderRadius: 12, textDecoration: "none", fontSize: 13, color: "#555", transition: "color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555")}
          >
            <LogOut size={16} /> Izloguj se
          </Link>
        </div>

        <style>{`
          .sb{position:fixed;top:0;left:0;bottom:0;width:250px;background:rgba(8,8,14,0.97);border-right:1px solid rgba(255,255,255,0.04);z-index:90;display:flex;flex-direction:column;transition:transform 0.3s ease}
          .sb-overlay{display:none}
          @media(max-width:899px){.sb{transform:translateX(-100%)}.sb.sb-open{transform:translateX(0)}.sb-overlay{display:block !important}}
        `}</style>
      </aside>
    </>
  );
}
