"use client";

import { Download, Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

const VideoEditor = dynamic(() => import("./VideoEditor"), { ssr: false });

interface Props {
  status: "idle" | "loading" | "finished" | "failed";
  progress?: number;
  files?: { file_url: string; file_type: string }[];
  error?: string;
  type: "image" | "video" | "audio";
}

export default function GenerationResult({ status, progress, files, error, type }: Props) {
  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <div style={{
        padding: 48, borderRadius: 20, textAlign: "center",
        background: "rgba(255,255,255,0.015)", border: "1px solid rgba(0,212,255,0.06)",
      }}>
        <Loader2 size={36} color="#00d4ff" style={{ animation: "spin 1.5s linear infinite", margin: "0 auto 18px", display: "block" }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 6 }}>Generisanje u toku...</div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
          {type === "video" ? "Ovo može potrajati 1-3 minuta" : type === "audio" ? "Ovo može potrajati 30-60 sekundi" : "Obično traje 10-30 sekundi"}
        </div>
        {progress !== undefined && progress > 0 && (
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
            <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #00d4ff, #7c3aed)", borderRadius: 5, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>{progress}%</div>
          </div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div style={{
        padding: 32, borderRadius: 20, textAlign: "center",
        background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)",
      }}>
        <AlertCircle size={30} color="#ef4444" style={{ margin: "0 auto 14px", display: "block" }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "#ef4444", marginBottom: 6 }}>Greška</div>
        <div style={{ fontSize: 13, color: "#888", maxWidth: 400, margin: "0 auto" }}>{error || "Generisanje nije uspelo. Pokušaj ponovo."}</div>
      </div>
    );
  }

  if (status === "finished" && files && files.length > 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.1em" }}>Generisano uspešno</span>
        </div>

        {files.map((f, i) => (
          <div key={i}>
            {type === "video" ? (
              <VideoEditor src={f.file_url} />
            ) : (
              <div style={{
                borderRadius: 20, overflow: "hidden", position: "relative",
                background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
              }}>
                {type === "image" && (
                  <img src={f.file_url} alt="Generated" style={{ width: "100%", display: "block" }} />
                )}
                {type === "audio" && (
                  <div style={{ padding: 28 }}>
                    <audio src={f.file_url} controls style={{ width: "100%" }} />
                  </div>
                )}
                <a href={f.file_url} download target="_blank" rel="noopener noreferrer" style={{
                  position: "absolute", top: 14, right: 14,
                  width: 38, height: 38, borderRadius: 11,
                  background: "rgba(5,5,8,0.85)", border: "1px solid rgba(0,212,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none", backdropFilter: "blur(10px)",
                  transition: "all 0.2s",
                }}>
                  <Download size={15} color="#00d4ff" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
