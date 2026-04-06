"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, type CSSProperties } from "react";
import ThankYouPhoneForm from "@/components/thank-you/ThankYouPhoneForm";
import { pushThankYouPageTracking, readStoredLeadConfirm } from "@/lib/tiktok-datalayer";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/aihype.official/" },
  { label: "TikTok", href: "https://www.tiktok.com/@ai.hype.akademija" },
  { label: "YouTube", href: "https://www.youtube.com/@AiHype-Academy" },
] as const;

const STEPS = [
  "Proveri email inbox (i spam folder)",
  "Čitaj mailove koje ti šaljemo",
  "Budi spreman/na kad se otvore prijave",
] as const;

/** Placeholder email samo za vidljivost forme na localhost-u (dizajn / responsive). */
const LOCALHOST_PHONE_FORM_PREVIEW_EMAIL = "preview-local@localhost.invalid";

function isThankYouLocalhostHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

function Icon({ name }: { name: "instagram" | "tiktok" | "youtube" }) {
  if (name === "instagram") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 16.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M17.2 6.8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "tiktok") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M14 3v10.2a4.8 4.8 0 1 1-4.2-4.77"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 6.2c1.05 1.52 2.62 2.53 4.5 2.8V6.2c-1.28-.28-2.74-1.2-3.5-3.2H14v3.2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 9.75v4.5l4-2.25-4-2.25Z"
        fill="currentColor"
      />
      <path
        d="M21.5 8.1s-.2-1.4-.8-2a2.8 2.8 0 0 0-2-0.8C15.9 5 12 5 12 5h0s-3.9 0-6.7.3a2.8 2.8 0 0 0-2 .8c-.6.6-.8 2-.8 2S2.2 9.7 2.2 11.3v1.5c0 1.6.3 3.2.3 3.2s.2 1.4.8 2c.6.6 1.4.8 2.3.9C7.3 19.1 12 19.1 12 19.1s3.9 0 6.7-.3c.8-.1 1.4-.2 2-.8.6-.6.8-2 .8-2s.3-1.6.3-3.2v-1.5c0-1.6-.3-3.2-.3-3.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnimatedCheckmark() {
  const reduced = useReducedMotion();
  const confetti = useMemo(() => {
    const pieces = Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const r = 70 + (i % 4) * 18;
      const x = Math.round(Math.cos(angle) * r);
      const y = Math.round(Math.sin(angle) * r * 0.72);
      const rot = Math.round((i * 37) % 180) - 90;
      const colors = ["#8b5cf6", "#7dd3fc", "#c4b5fd", "#6366f1", "#a855f7"];
      return { x, y, rot, color: colors[i % colors.length], isRect: i % 3 === 0 };
    });
    return pieces;
  }, []);

  type ConfettiPieceStyle = CSSProperties & { ["--x"]: string; ["--y"]: string; ["--r"]: string };

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="relative grid place-items-center"
        style={{
          width: 80,
          height: 80,
          borderRadius: 999,
          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
          boxShadow: "0 0 40px rgba(139,92,246, 0.25)",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 52 52" fill="none" aria-hidden>
          <path
            d="M14 27.5l8 8 16-18"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ty-check"
          />
        </svg>
        <motion.div
          aria-hidden
          initial={reduced ? { opacity: 0 } : { opacity: 0 }}
          animate={reduced ? { opacity: 0 } : { opacity: [0, 0.3, 0], scale: [1, 1.5, 1.8] }}
          transition={reduced ? { duration: 0 } : { duration: 0.4, delay: 0.8, ease: "easeOut" }}
          className="absolute inset-0"
          style={{
            borderRadius: 999,
            border: "2px solid rgba(139,92,246, 0.20)",
          }}
        />
      </motion.div>

      {!reduced ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="relative" style={{ width: 2, height: 2 }}>
            {confetti.map((c, idx) => (
              <div
                key={idx}
                className="ty-confetti"
                style={
                  {
                    ["--x"]: `${c.x}px`,
                    ["--y"]: `${c.y}px`,
                    ["--r"]: `${c.rot}deg`,
                  background: c.color,
                  width: c.isRect ? 3 : 5,
                  height: c.isRect ? 8 : 5,
                  borderRadius: c.isRect ? 2 : 999,
                  } as ConfettiPieceStyle
                }
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BackgroundEffects() {
  const reduced = useReducedMotion();
  const particles = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => {
      const left = (i * 73) % 100;
      const top = (i * 41) % 100;
      const size = 2 + (i % 3);
      const dur = 4 + (i % 5);
      const delay = (i % 4) * 0.6;
      const op = 0.05 + (i % 4) * 0.02;
      return { left, top, size, dur, delay, op };
    });
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255, 0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          opacity: 1,
        }}
      />

      <div
        aria-hidden
        className="absolute left-1/2 top-[25%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 700,
          height: 500,
          filter: "blur(0px)",
          background: "radial-gradient(ellipse, rgba(139,92,246, 0.10) 0%, transparent 70%)",
          animation: reduced ? "none" : "tyGlow1 6s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute left-[30%] top-[70%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 500,
          height: 400,
          background: "radial-gradient(ellipse, rgba(125,211,252, 0.06) 0%, transparent 70%)",
          animation: reduced ? "none" : "tyGlow2 6s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute left-[70%] top-[40%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 400,
          height: 350,
          background: "radial-gradient(ellipse, rgba(99,102,241, 0.05) 0%, transparent 70%)",
          animation: reduced ? "none" : "tyGlow3 8s ease-in-out infinite",
        }}
      />

      {!reduced
        ? particles.map((p, i) => (
            <div
              key={i}
              aria-hidden
              className="absolute rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                background: `rgba(255,255,255, ${p.op})`,
                animation: `tyFloat ${p.dur}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))
        : null}
    </>
  );
}

export default function ThankYouClient() {
  const reduced = useReducedMotion();
  const ease = [0.16, 1, 0.3, 1] as const;
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get("eid");
  const [leadEmail] = useState<string | null>(() => {
    const stored = readStoredLeadConfirm();
    return stored?.email ?? null;
  });
  const [defaultCountry, setDefaultCountry] = useState("RS");
  const [localhostPhonePreview] = useState(() => isThankYouLocalhostHost());

  useEffect(() => {
    void pushThankYouPageTracking({ eventIdFromUrl });
  }, [eventIdFromUrl]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leads/geo")
      .then((r) => r.json())
      .then((d: { defaultCountry?: string }) => {
        if (!cancelled && typeof d?.defaultCountry === "string" && d.defaultCountry.length === 2) {
          setDefaultCountry(d.defaultCountry);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const showPhoneFormBlock = Boolean(leadEmail || localhostPhonePreview);
  const phoneFormEmail = leadEmail ?? LOCALHOST_PHONE_FORM_PREVIEW_EMAIL;
  const phoneFormIsLocalPreview = !leadEmail && localhostPhonePreview;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#050508]">
      <style>{`
        @keyframes tyGlow1 { 0%,100%{opacity:.08} 50%{opacity:.14} }
        @keyframes tyGlow2 { 0%,100%{opacity:.06} 50%{opacity:.12} }
        @keyframes tyGlow3 { 0%,100%{transform:translate(-50%,-50%) translateX(-30px)} 50%{transform:translate(-50%,-50%) translateX(30px)} }
        @keyframes tyFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-22px)} }
        .ty-check{stroke-dasharray:50; stroke-dashoffset:50; animation:${reduced ? "none" : "tyDraw .4s ease .4s forwards"};}
        @keyframes tyDraw { to{stroke-dashoffset:0} }
        .ty-confetti{ position:absolute; left:0; top:0; transform:translate(0,0) rotate(0deg); opacity:0; animation: confettiBurst .8s ease-out .6s both; }
        @keyframes confettiBurst {
          0% { transform: translate(0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--x), var(--y)) rotate(var(--r)); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce){
          .ty-check,.ty-confetti{animation:none !important;}
        }
      `}</style>

      <BackgroundEffects />

      <div className="relative z-10 flex min-h-dvh w-full max-w-[100vw] flex-col items-center justify-center px-4 py-5 max-md:py-6 md:max-lg:px-6 md:max-lg:py-9 lg:px-6 lg:py-11">
        <div
          className="w-full max-w-[min(720px,100%)] rounded-[20px] border px-4 pt-6 pb-8 md:max-lg:max-w-[640px] md:max-lg:rounded-[22px] md:max-lg:px-8 md:max-lg:pt-9 md:max-lg:pb-10 lg:max-w-[720px] lg:rounded-[24px] lg:px-10 lg:pt-12 lg:pb-14"
          style={{
            background: "#0b0f1a",
            borderColor: "rgba(255,255,255,0.06)",
            boxShadow: "0 0 0 1px rgba(125,211,252,0.08), 0 35px 110px rgba(0,0,0,0.55)",
          }}
        >
          <div className="flex w-full flex-col items-center gap-y-4 text-center md:max-lg:gap-y-6 lg:gap-y-8">
            <AnimatedCheckmark />

            <div className="flex flex-col items-center gap-y-1.5 text-center md:gap-y-2 lg:gap-y-2.5">
              <motion.h1
                initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 0.8, ease }}
                className="text-[26px] font-extrabold leading-[1.12] md:max-lg:text-[34px] md:max-lg:leading-[1.14] lg:text-[42px] lg:leading-[1.15]"
                style={{ color: "#fff" }}
              >
                Uspešno!{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #c4b5fd, #7dd3fc)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Na listi si.
                </span>{" "}
                🎉
              </motion.h1>

              <motion.p
                initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 1.0, ease }}
                className="max-w-[min(440px,100%)] text-[15px] leading-[1.65] md:max-lg:text-[16px] md:max-lg:leading-[1.7] lg:text-[18px]"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Proveri svoj inbox — poslaćemo ti sve detalje u narednim danima.
              </motion.p>
            </div>

            <motion.div
              initial={reduced ? { width: 80, opacity: 1 } : { width: 0, opacity: 0 }}
              animate={{ width: 80, opacity: 1 }}
              transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 1.2, ease }}
              className="h-px w-16 shrink-0 md:max-lg:w-20 lg:w-24"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
            />

            <div className="w-full max-w-[min(580px,100%)] space-y-3 md:max-lg:space-y-4 lg:space-y-5">
              {STEPS.map((t, idx) => (
                <motion.div
                  key={t}
                  initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 1.4 + idx * 0.15, ease }}
                  className="group flex items-center gap-3 rounded-[14px] border px-4 py-3.5 text-left md:max-lg:gap-4 md:max-lg:px-5 md:max-lg:py-4 lg:gap-4 lg:px-6 lg:py-5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.05)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    className="grid h-9 w-9 place-items-center rounded-full border text-[14px] font-bold"
                    style={{
                      background: "rgba(139,92,246, 0.10)",
                      borderColor: "rgba(139,92,246, 0.15)",
                      color: "#a78bfa",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="text-[14px] font-medium leading-[1.45] md:max-lg:text-[15px] lg:text-[15px] lg:leading-[1.5]" style={{ color: "#fff" }}>
                    {t}
                  </div>
                </motion.div>
              ))}
            </div>

            {showPhoneFormBlock ? (
              <motion.div
                initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.55, delay: 1.82, ease }}
                className="w-full"
              >
                <ThankYouPhoneForm
                  email={phoneFormEmail}
                  defaultCountryCode={defaultCountry}
                  isLocalDesignPreview={phoneFormIsLocalPreview}
                />
              </motion.div>
            ) : null}

            <motion.div
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 2.05, ease }}
              className="text-center"
            >
              <div className="text-[13px] font-medium tracking-[0.05em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                Prati nas dok čekaš
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 md:max-lg:mt-4 lg:mt-5">
                {SOCIAL_LINKS.map((s) => {
                  const name =
                    s.label === "Instagram" ? "instagram" : s.label === "TikTok" ? "tiktok" : "youtube";
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-11 w-11 place-items-center rounded-full border"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderColor: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.70)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(139,92,246, 0.10)";
                        e.currentTarget.style.borderColor = "rgba(139,92,246, 0.20)";
                        e.currentTarget.style.color = "#c4b5fd";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.70)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      aria-label={s.label}
                    >
                      <Icon name={name} />
                    </a>
                  );
                })}
              </div>
            </motion.div>

              <div className="flex w-full flex-col items-center pt-4 md:max-lg:pt-6 lg:pt-8">
                <motion.div
                  initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 2.35, ease }}
                >
                  <Link
                    href="/"
                    className="grid h-11 w-11 place-items-center rounded-full border"
                    style={{
                      borderColor: "rgba(125,211,252, 0.25)",
                      background: "rgba(125,211,252,0.06)",
                      color: "rgba(255,255,255,0.85)",
                      transition: "all 0.25s ease",
                    }}
                    aria-label="Home"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M3 10.5 12 3l9 7.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6.5 9.8V21h11V9.8"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </motion.div>

                <motion.div
                  initial={reduced ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 2.2, ease }}
                  className="mt-4 pb-1 text-[11px] md:max-lg:mt-5 lg:mt-6"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  © 2025 AI Hype Academy
                </motion.div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

