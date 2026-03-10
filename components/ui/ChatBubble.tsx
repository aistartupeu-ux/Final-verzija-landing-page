"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !greeted) {
      setMessages([{ role: "assistant", content: "Zdravo! 👋 Ja sam AI asistent AI Hype Academy. Kako ti mogu pomoći?" }]);
      setGreeted(true);
    }
  }, [open, greeted]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message || data.error || "Greška." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Nešto je pošlo po zlu. Pokušaj ponovo." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 999,
          width: 380, maxWidth: "calc(100vw - 32px)", height: 520, maxHeight: "70vh",
          borderRadius: 24, overflow: "hidden",
          background: "rgba(10,10,18,0.97)", border: "1px solid rgba(0,212,255,0.12)",
          boxShadow: "0 16px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,212,255,0.05)",
          display: "flex", flexDirection: "column",
          animation: "chatIn 0.3s ease forwards",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(124,58,237,0.04))",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Hype Asistent</div>
                <div style={{ fontSize: 10, color: "#22c55e", display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "none", border: "none", color: "#666", cursor: "pointer", padding: 4,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#666")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{
            flex: 1, overflowY: "auto", padding: "16px 16px 8px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={m.role === "user" ? {
                  maxWidth: "82%", padding: "10px 14px", borderRadius: 16, borderBottomRightRadius: 4,
                  fontSize: 13, lineHeight: 1.6, color: "#050508",
                  background: "linear-gradient(135deg, #00d4ff, #0090b0)",
                } : {
                  maxWidth: "82%", padding: "10px 14px", borderRadius: 16, borderBottomLeftRadius: 4,
                  fontSize: 13, lineHeight: 1.6, color: "#fff",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "12px 18px", borderRadius: 16, borderBottomLeftRadius: 4,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animation: "dot 1.4s infinite 0s" }} />
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animation: "dot 1.4s infinite 0.2s" }} />
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animation: "dot 1.4s infinite 0.4s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.04)",
          }}>
            <form onSubmit={e => { e.preventDefault(); send(); }} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.03)", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)", padding: "4px 4px 4px 14px",
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pitaj me nešto..."
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  color: "#fff", fontSize: 13, fontFamily: "inherit", padding: "8px 0",
                }}
              />
              <button type="submit" disabled={loading || !input.trim()} style={{
                width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer",
                background: input.trim() ? "linear-gradient(135deg, #00d4ff, #0090b0)" : "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", opacity: input.trim() ? 1 : 0.4,
              }}>
                <Send size={14} color={input.trim() ? "#050508" : "#555"} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 998,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.1)",
          transition: "all 0.3s ease",
          transform: open ? "scale(0.9)" : "scale(1)",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={e => (e.currentTarget.style.transform = open ? "scale(0.9)" : "scale(1)")}
      >
        {open ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
      </button>

      <style>{`
      `}</style>
    </>
  );
}
