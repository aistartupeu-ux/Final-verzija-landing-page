"use client";

import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#050508" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <style>{`
        .dash-content{margin-left:250px;min-height:100vh}
        .dash-mobile-bar{display:none}
        @media(max-width:899px){.dash-content{margin-left:0}.dash-mobile-bar{display:flex}}
      `}</style>

      <div className="dash-content">
        <div className="dash-mobile-bar" style={{
          padding: "14px 20px", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(8,8,14,0.95)",
          backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 80,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #00d4ff, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>AI <span style={{ color: "#00d4ff" }}>HYPE</span></span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "#777", cursor: "pointer", padding: 4 }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div style={{ padding: "36px 32px 48px", maxWidth: 1050 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
