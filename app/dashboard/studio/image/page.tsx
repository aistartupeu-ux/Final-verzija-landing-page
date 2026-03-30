"use client";

import { useState, useCallback } from "react";
import { Image as ImageIcon, Sparkles, Layers, Zap, Star, Crown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PromptInput from "@/components/dashboard/PromptInput";
import GenerationResult from "@/components/dashboard/GenerationResult";

const MODELS = [
  { id: "seedream-4.5", name: "Seedream 4.5", provider: "ByteDance", icon: ImageIcon, color: "#f97316" },
  { id: "seedream-5.0-lite", name: "Seedream 5.0", provider: "ByteDance", icon: Layers, color: "#ef4444" },
  { id: "nano-banana", name: "Nano Banana", provider: "Google", icon: Zap, color: "#facc15" },
  { id: "gemini-3.1-flash-image-preview", name: "Nano Banana 2", provider: "Google", icon: Star, color: "#22c55e" },
  { id: "nano-banana-2", name: "Nano Banana Pro", provider: "Google", icon: Crown, color: "#a855f7" },
];

const RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export default function ImageGenPage() {
  const [model, setModel] = useState("nano-banana");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [status, setStatus] = useState<"idle" | "loading" | "finished" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<{ file_url: string; file_type: string }[]>([]);
  const [error, setError] = useState("");

  const poll = useCallback(async (taskId: string) => {
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await fetch(`/api/ai/status/${taskId}`);
        const data = await res.json();
        const task = data.data;
        if (task?.progress) setProgress(task.progress);
        if (task?.status === "finished") { setFiles(task.files || []); setStatus("finished"); return; }
        if (task?.status === "failed") { setError(task.error_message || "Generation failed"); setStatus("failed"); return; }
      } catch { /* continue */ }
    }
    setError("Timeout"); setStatus("failed");
  }, []);

  const generate = async () => {
    if (!prompt.trim()) return;
    setStatus("loading"); setProgress(0); setFiles([]); setError("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: { prompt, size: ratio } }),
      });
      const data = await res.json();
      if (data.data?.task_id) poll(data.data.task_id);
      else { setError(data.error?.message || "Submit failed"); setStatus("failed"); }
    } catch { setError("Network error"); setStatus("failed"); }
  };

  const sel = MODELS.find(m => m.id === model)!;

  return (
    <div>
      <Link href="/dashboard/studio" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#555", textDecoration: "none", fontSize: 12, marginBottom: 20, transition: "color 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")} onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
        <ArrowLeft size={13} /> Nazad na alate
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImageIcon size={18} color="#a855f7" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Generisanje Slika</h1>
      </div>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 32 }}>Biraj model, unesi prompt i generiši profesionalne slike.</p>

      <style>{`.gen-layout{display:grid;grid-template-columns:1fr;gap:28px}@media(min-width:750px){.gen-layout{grid-template-columns:1fr 340px}}`}</style>
      <div className="gen-layout">
        {/* Left: Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Model selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "block" }}>Model</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {MODELS.map(m => {
                const active = model === m.id;
                return (
                  <button key={m.id} onClick={() => setModel(m.id)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                    borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                    border: `1px solid ${active ? m.color + "35" : "rgba(255,255,255,0.04)"}`,
                    background: active ? m.color + "0a" : "rgba(255,255,255,0.015)",
                    transition: "all 0.2s ease",
                    boxShadow: active ? `0 0 20px ${m.color}08` : "none",
                  }}>
                    <m.icon size={14} color={active ? m.color : "#555"} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: active ? "#eee" : "#888" }}>{m.name}</div>
                      <div style={{ fontSize: 9, color: "#555" }}>{m.provider}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "block" }}>Prompt</label>
            <PromptInput value={prompt} onChange={setPrompt} placeholder="Opiši sliku... npr. 'A futuristic city at sunset, cinematic lighting, 4K'" />
          </div>

          {/* Ratio */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "block" }}>Aspect Ratio</label>
            <div style={{ display: "flex", gap: 6 }}>
              {RATIOS.map(r => (
                <button key={r} onClick={() => setRatio(r)} style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  border: `1px solid ${ratio === r ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.04)"}`,
                  background: ratio === r ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.015)",
                  color: ratio === r ? "#00d4ff" : "#777", transition: "all 0.2s",
                }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button onClick={generate} disabled={status === "loading" || !prompt.trim()} className="glow-btn" style={{
            borderRadius: 14, padding: "14px 32px", fontSize: 14, alignSelf: "flex-start",
            opacity: !prompt.trim() ? 0.35 : 1,
          }}>
            <Sparkles size={16} /> Generiši sliku
          </button>
        </div>

        {/* Right: Preview / Settings Card */}
        <div style={{
          padding: 24, borderRadius: 20,
          background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Podešavanja</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#666" }}>Model</span>
              <span style={{ color: sel.color, fontWeight: 600 }}>{sel.name}</span>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.03)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#666" }}>Provider</span>
              <span style={{ color: "#999" }}>{sel.provider}</span>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.03)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#666" }}>Ratio</span>
              <span style={{ color: "#00d4ff", fontWeight: 600 }}>{ratio}</span>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.03)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#666" }}>Prompt</span>
              <span style={{ color: "#999" }}>{prompt.length} chars</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ marginTop: 32 }}>
        <GenerationResult status={status} progress={progress} files={files} error={error} type="image" />
      </div>
    </div>
  );
}
