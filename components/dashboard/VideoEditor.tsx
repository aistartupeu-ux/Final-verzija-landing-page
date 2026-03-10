"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Scissors, Download, Loader2, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";

interface Props {
  src: string;
}

export default function VideoEditor({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimming, setTrimming] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [dragging, setDragging] = useState<null | "start" | "end" | "playhead">(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => { setDuration(v.duration); setTrimEnd(v.duration); };
    const onTime = () => setCurrent(v.currentTime);
    const onEnded = () => setPlaying(false);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => { v.removeEventListener("loadedmetadata", onLoaded); v.removeEventListener("timeupdate", onTime); v.removeEventListener("ended", onEnded); };
  }, [src]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); } else { v.play(); }
    setPlaying(!playing);
  };

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, duration));
    setCurrent(v.currentTime);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${String(sec).padStart(2, "0")}.${ms}`;
  };

  const pct = (t: number) => duration > 0 ? (t / duration) * 100 : 0;

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    seek(x * duration);
  }, [duration]);

  const handleTrimDrag = useCallback((e: React.MouseEvent, type: "start" | "end") => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(type);

    const onMove = (ev: MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const t = x * duration;
      if (type === "start") setTrimStart(Math.min(t, trimEnd - 0.1));
      else setTrimEnd(Math.max(t, trimStart + 0.1));
    };

    const onUp = () => {
      setDragging(null);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [duration, trimStart, trimEnd]);

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);

    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();

      ffmpeg.on("progress", ({ progress }) => {
        setExportProgress(Math.round(progress * 100));
      });

      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js",
        wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm",
      });

      const videoData = await fetchFile(src);
      await ffmpeg.writeFile("input.mp4", videoData);

      const ss = trimStart.toFixed(2);
      const dur = (trimEnd - trimStart).toFixed(2);

      await ffmpeg.exec([
        "-i", "input.mp4",
        "-ss", ss,
        "-t", dur,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-movflags", "+faststart",
        "output.mp4",
      ]);

      const data = await ffmpeg.readFile("output.mp4");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([data as any], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-video-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed. Your browser may not support SharedArrayBuffer.");
    }

    setExporting(false);
  };

  const trimDuration = trimEnd - trimStart;

  return (
    <div style={{
      borderRadius: 20, overflow: "hidden",
      background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
    }}>
      {/* Video Player */}
      <div style={{ position: "relative", background: "#000", cursor: "pointer" }} onClick={togglePlay}>
        <video
          ref={videoRef}
          src={src}
          muted={muted}
          style={{ width: "100%", display: "block", maxHeight: 480 }}
        />
        {!playing && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(0,212,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 30px rgba(0,212,255,0.3)",
            }}>
              <Play size={24} color="#050508" style={{ marginLeft: 3 }} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {/* Transport controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button onClick={() => seek(0)} title="Početak" style={btnStyle}><SkipBack size={14} /></button>
          <button onClick={togglePlay} title={playing ? "Pauza" : "Pusti"} style={{ ...btnStyle, width: 38, height: 38, background: "rgba(0,212,255,0.1)", borderColor: "rgba(0,212,255,0.2)" }}>
            {playing ? <Pause size={15} color="#00d4ff" /> : <Play size={15} color="#00d4ff" style={{ marginLeft: 1 }} />}
          </button>
          <button onClick={() => seek(duration)} title="Kraj" style={btnStyle}><SkipForward size={14} /></button>
          <button onClick={() => setMuted(!muted)} title={muted ? "Uključi zvuk" : "Isključi zvuk"} style={btnStyle}>
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 12, color: "#888", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <button onClick={() => { const v = videoRef.current; if (v) v.requestFullscreen?.(); }} title="Fullscreen" style={btnStyle}>
            <Maximize size={14} />
          </button>
        </div>

        {/* Timeline */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          style={{
            position: "relative", height: 48, borderRadius: 8, cursor: "pointer", userSelect: "none",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
            marginBottom: 14,
          }}
        >
          {/* Trim region */}
          {trimming && (
            <div style={{
              position: "absolute", top: 0, bottom: 0, borderRadius: 6,
              left: `${pct(trimStart)}%`, width: `${pct(trimEnd) - pct(trimStart)}%`,
              background: "rgba(0,212,255,0.08)", borderLeft: "2px solid #00d4ff", borderRight: "2px solid #00d4ff",
            }}>
              {/* Start handle */}
              <div
                onMouseDown={e => handleTrimDrag(e, "start")}
                style={{
                  position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)",
                  width: 16, height: 28, borderRadius: 4, cursor: "ew-resize",
                  background: dragging === "start" ? "#00d4ff" : "rgba(0,212,255,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 8px rgba(0,212,255,0.3)",
                }}>
                <div style={{ width: 2, height: 12, borderRadius: 1, background: "#050508" }} />
              </div>
              {/* End handle */}
              <div
                onMouseDown={e => handleTrimDrag(e, "end")}
                style={{
                  position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)",
                  width: 16, height: 28, borderRadius: 4, cursor: "ew-resize",
                  background: dragging === "end" ? "#00d4ff" : "rgba(0,212,255,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 8px rgba(0,212,255,0.3)",
                }}>
                <div style={{ width: 2, height: 12, borderRadius: 1, background: "#050508" }} />
              </div>
            </div>
          )}

          {/* Dimmed regions outside trim */}
          {trimming && (
            <>
              <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${pct(trimStart)}%`, background: "rgba(0,0,0,0.5)", borderRadius: "8px 0 0 8px" }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${100 - pct(trimEnd)}%`, background: "rgba(0,0,0,0.5)", borderRadius: "0 8px 8px 0" }} />
            </>
          )}

          {/* Playhead */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: `${pct(currentTime)}%`,
            width: 2, background: "#fff", borderRadius: 2,
            boxShadow: "0 0 6px rgba(255,255,255,0.3)",
            transition: dragging ? "none" : "left 0.1s linear",
          }}>
            <div style={{
              position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)",
              width: 10, height: 10, borderRadius: "50%", background: "#fff",
              boxShadow: "0 0 6px rgba(255,255,255,0.4)",
            }} />
          </div>
        </div>

        {/* Trim controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => { setTrimming(!trimming); if (!trimming) { setTrimStart(0); setTrimEnd(duration); } }}
              style={{
                ...btnStyle, gap: 6, padding: "8px 14px", fontSize: 12, fontWeight: 600,
                borderColor: trimming ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)",
                background: trimming ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.02)",
                color: trimming ? "#00d4ff" : "#888",
              }}
            >
              <Scissors size={13} /> {trimming ? "Trimovanje aktivno" : "Trimiraj"}
            </button>

            {trimming && (
              <span style={{ fontSize: 11, color: "#666", fontFamily: "monospace" }}>
                {fmt(trimStart)} — {fmt(trimEnd)} ({fmt(trimDuration)})
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => seek(0)} style={{ ...btnStyle, gap: 6, padding: "8px 14px", fontSize: 12, fontWeight: 600 }}>
              <RotateCcw size={13} /> Reset
            </button>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="glow-btn"
              style={{ borderRadius: 10, padding: "8px 18px", fontSize: 12, gap: 6 }}
            >
              {exporting ? (
                <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> {exportProgress}%</>
              ) : (
                <><Download size={13} /> Exportuj{trimming ? " trimovan" : ""}</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 34, height: 34, borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
  border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)",
  color: "#888", transition: "all 0.2s", padding: 0, gap: 0,
};
