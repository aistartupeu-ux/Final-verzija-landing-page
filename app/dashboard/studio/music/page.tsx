"use client";

import { useState, useCallback } from "react";
import { Music, Sparkles, Mic, Guitar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PromptInput from "@/components/dashboard/PromptInput";
import GenerationResult from "@/components/dashboard/GenerationResult";

const STYLES = ["Pop", "Hip Hop", "Electronic", "Rock", "R&B", "Jazz", "Classical", "Lo-Fi", "Ambient", "Cinematic"];

export default function MusicGenPage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [instrumental, setInstrumental] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "finished" | "failed">("idle");
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<{ file_url: string; file_type: string }[]>([]);
  const [error, setError] = useState("");

  const poll = useCallback(async (taskId: string) => {
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/ai/music/${taskId}`);
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
      const res = await fetch("/api/ai/music", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { prompt, style, title: prompt.slice(0, 78), custom_mode: true, instrumental, mv: "V5" },
        }),
      });
      const data = await res.json();
      if (data.data?.task_id) poll(data.data.task_id);
      else { setError(data.error?.message || "Submit failed"); setStatus("failed"); }
    } catch { setError("Network error"); setStatus("failed"); }
  };

  return (
    <div>
      <Link href="/dashboard/studio" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#555", textDecoration: "none", fontSize: 12, marginBottom: 20, transition: "color 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")} onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
        <ArrowLeft size={13} /> Nazad na alate
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Music size={18} color="#ec4899" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>AI Muzika</h1>
      </div>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 32 }}>Kreiraj originalnu muziku, pesme sa vokalima ili instrumentale.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "block" }}>Opiši pesmu</label>
          <PromptInput value={prompt} onChange={setPrompt} placeholder="Opiši kakvu muziku želiš... npr. 'Energičan beat sa melodičnim vokalima o uspehu'" />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "block" }}>Stil</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)} style={{
                padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                border: `1px solid ${style === s ? "rgba(236,72,153,0.25)" : "rgba(255,255,255,0.04)"}`,
                background: style === s ? "rgba(236,72,153,0.06)" : "rgba(255,255,255,0.015)",
                color: style === s ? "#ec4899" : "#777", transition: "all 0.2s",
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "block" }}>Tip</label>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setInstrumental(false)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${!instrumental ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.04)"}`,
              background: !instrumental ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.015)",
              color: !instrumental ? "#00d4ff" : "#777", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
            }}>
              <Mic size={14} /> Sa vokalima
            </button>
            <button onClick={() => setInstrumental(true)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${instrumental ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.04)"}`,
              background: instrumental ? "rgba(168,85,247,0.06)" : "rgba(255,255,255,0.015)",
              color: instrumental ? "#a855f7" : "#777", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
            }}>
              <Guitar size={14} /> Instrumental
            </button>
          </div>
        </div>

        <button onClick={generate} disabled={status === "loading" || !prompt.trim()} className="glow-btn" style={{
          borderRadius: 14, padding: "14px 32px", fontSize: 14, alignSelf: "flex-start",
          opacity: !prompt.trim() ? 0.35 : 1,
        }}>
          <Sparkles size={16} /> Generiši muziku
        </button>

        <GenerationResult status={status} progress={progress} files={files} error={error} type="audio" />
      </div>
    </div>
  );
}
