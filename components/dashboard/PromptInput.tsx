"use client";

import { useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function PromptInput({ value, onChange, placeholder = "Opiši šta želiš da generišeš...", maxLength = 2000 }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        style={{
          width: "100%", padding: "16px 18px", borderRadius: 16, resize: "vertical",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(0,212,255,0.35)" : "rgba(255,255,255,0.08)"}`,
          outline: "none", color: "#fff", fontSize: 14, fontFamily: "inherit", lineHeight: 1.6,
          transition: "border-color 0.3s, box-shadow 0.3s",
          boxShadow: focused ? "0 0 25px rgba(0,212,255,0.06)" : "none",
          minHeight: 100,
        }}
      />
      <div style={{ textAlign: "right", fontSize: 11, color: "#444", marginTop: 4 }}>{value.length}/{maxLength}</div>
    </div>
  );
}
