"use client";

import type { LucideIcon } from "lucide-react";

interface Model {
  id: string;
  name: string;
  provider: string;
  icon: LucideIcon;
  color: string;
}

interface Props {
  models: Model[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function ModelSelector({ models, selected, onSelect }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {models.map(m => {
        const active = selected === m.id;
        return (
          <button key={m.id} onClick={() => onSelect(m.id)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
            borderRadius: 12, border: `1px solid ${active ? m.color + "40" : "rgba(255,255,255,0.06)"}`,
            background: active ? m.color + "10" : "rgba(255,255,255,0.02)",
            cursor: "pointer", transition: "all 0.2s ease", fontFamily: "inherit",
            boxShadow: active ? `0 0 15px ${m.color}10` : "none",
          }}>
            <m.icon size={16} color={active ? m.color : "#666"} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: active ? "#fff" : "#999" }}>{m.name}</div>
              <div style={{ fontSize: 10, color: "#555" }}>{m.provider}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
