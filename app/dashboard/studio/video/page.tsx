"use client";

import { useState, useCallback } from "react";
import { Film, Sparkles, Clapperboard, Move, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PromptInput from "@/components/dashboard/PromptInput";
import GenerationResult from "@/components/dashboard/GenerationResult";

const MODELS = [
  { id: "kling-3.0/standard", name: "Kling 3.0", provider: "Kuaishou", icon: Clapperboard, color: "#00d4ff" },
  { id: "kling-2.6", name: "Kling 2.6", provider: "Kuaishou", icon: Film, color: "#22c55e" },
  { id: "kling-2.6-motion-control", name: "Kling Motion", provider: "Kuaishou", icon: Move, color: "#f97316" },
  { id: "veo3.1-fast", name: "VEO 3.1", provider: "Google", icon: Eye, color: "#a855f7" },
];

export default function VideoGenPage() {
  const [model, setModel] = useState("kling-3.0/standard");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("5");
  const [status, setStatus] = useState<"idle" | "loading" | "finished" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<{ file_url: string; file_type: string }[]>([]);
  const [error, setError] = useState("");

  const poll = useCallback(async (taskId: string) => {
    for (let i = 0; i < 180; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/ai/status/${taskId}`);
        const data = await res.json();
        const task = data.data;
        if (task?.progress) setProgress(task.progress);
        if (task?.status === "finished") { setFiles(task.files || []); setStatus("finished"); return; }
        if (task?.status === "failed") { setError(task.error_message || "Failed"); setStatus("failed"); return; }
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
        body: JSON.stringify({
          model, input: {
            prompt, duration: parseInt(duration), aspect_ratio: "16:9", sound: true,
            ...(model.startsWith("kling-3") ? { multi_shots: false } : {}),
          },
        }),
      });
      const data = await res.json();
      if (data.data?.task_id) poll(data.data.task_id);
      else { setError(data.error?.message || "Submit failed"); setStatus("failed"); }
    } catch { setError("Network error"); setStatus("failed"); }
  };

  const sel = MODELS.find(m => m.id === model)!;
  const durations = model === "veo3.1-fast" ? ["8"] : ["5", "10"];

  return (
    <div>
      <Link href="/dashboard/studio" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#555", textDecoration: "none", fontSize: 12, marginBottom: 20, transition: "color 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")} onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
        <ArrowLeft size={13} /> Nazad na alate
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Film size={18} color="#00d4ff" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>AI Video Produkcija</h1>
      </div>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 32 }}>Generiši videe iz teksta koristeći najmodernije AI modele.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "block" }}>Model</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MODELS.map(m => {
              const active = model === m.id;
              return (
                <button key={m.id} onClick={() => { setModel(m.id); if (m.id === "veo3.1-fast") setDuration("8"); }} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                  borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                  border: `1px solid ${active ? m.color + "35" : "rgba(255,255,255,0.04)"}`,
                  background: active ? m.color + "0a" : "rgba(255,255,255,0.015)",
                  transition: "all 0.2s", boxShadow: active ? `0 0 20px ${m.color}08` : "none",
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

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "block" }}>Prompt</label>
          <PromptInput value={prompt} onChange={setPrompt} placeholder="Opiši video... npr. 'Drone shot of a mountain lake at sunrise, cinematic, 4K'" />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "block" }}>Trajanje</label>
          <div style={{ display: "flex", gap: 6 }}>
            {durations.map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{
                padding: "8px 20px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                border: `1px solid ${duration === d ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.04)"}`,
                background: duration === d ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.015)",
                color: duration === d ? "#00d4ff" : "#777", transition: "all 0.2s",
              }}>{d}s</button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={status === "loading" || !prompt.trim()} className="glow-btn" style={{
          borderRadius: 14, padding: "14px 32px", fontSize: 14, alignSelf: "flex-start",
          opacity: !prompt.trim() ? 0.35 : 1,
        }}>
          <Sparkles size={16} /> Generiši video
        </button>

        <GenerationResult status={status} progress={progress} files={files} error={error} type="video" />
      </div>
    </div>
  );
}
