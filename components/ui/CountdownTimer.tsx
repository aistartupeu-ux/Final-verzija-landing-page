"use client";

import { Fragment, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type CountdownTheme = "default" | "giveaway";
type TimerState = { d: number; h: number; m: number; s: number; isFinished: boolean };

function AnimatedDigit({ value }: { value: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: 12, opacity: 0, scale: 0.8, filter: "blur(4px)" }}
        animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ y: -12, opacity: 0, scale: 0.8, filter: "blur(4px)" }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="inline-block tabular-nums text-[30px] sm:text-[36px] font-extrabold leading-none bg-gradient-to-b from-[#fef3c7] via-[#fbbf24] to-[#b45309] bg-clip-text text-transparent"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

function GiveawayTimeBlock({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.15 * index, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center group"
    >
      <div className="relative giveaway-timeblock">
        <div className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_70%)]" />
        <div className="relative flex items-center justify-center w-[72px] h-[82px] sm:w-[84px] sm:h-[94px] rounded-2xl bg-gradient-to-b from-[#111827] to-[#0c1019] border border-white/[0.06] overflow-hidden group-hover:border-[#fbbf24]/[0.15] transition-all duration-500">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-y-[0.5px] pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none bg-[length:200%_100%] giveaway-shimmer-sweep"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, rgba(251,191,36,0.04) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
            }}
          />
          <div className="relative z-10 flex items-center justify-center gap-px">
            <AnimatedDigit value={value[0] ?? "0"} />
            <AnimatedDigit value={value[1] ?? "0"} />
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#fbbf24]/[0.10] to-transparent pointer-events-none" />
        </div>
      </div>
      <span className="giveaway-timeblock__unit mt-2.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30 group-hover:text-[#fbbf24]/50 transition-colors duration-500">
        {label}
      </span>
    </motion.div>
  );
}

function GiveawaySeparator({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 * index + 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center gap-2 self-center pb-1 sm:pb-0 h-[82px] sm:h-[94px]"
    >
      <div className="w-[3px] h-[3px] rounded-full bg-[#fbbf24]/40 giveaway-separator-pulse" />
      <div
        className="w-[3px] h-[3px] rounded-full bg-[#fbbf24]/40 giveaway-separator-pulse"
        style={{ animationDelay: "0.6s" }}
      />
    </motion.div>
  );
}

function GiveawayTimer({
  items,
  label,
  finished,
}: {
  items: Array<{ v: number; l: string }>;
  label: string;
  finished: boolean;
}) {
  const blocks = items.map((item) => ({ value: String(item.v).padStart(2, "0"), label: item.l }));

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] mx-auto text-center py-8"
      >
        <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#fbbf24]/[0.08] border border-[#fbbf24]/[0.15]">
          <span className="text-lg">⏱</span>
          <span className="text-[15px] font-bold text-[#fbbf24]">Vreme je isteklo!</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="giveaway-timer w-full max-w-[440px] mx-auto -mt-1 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="giveaway-timer__label text-center mb-3 -mt-0.5"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]/60 giveaway-live-dot" />
          {label}
        </span>
      </motion.div>

      <div className="giveaway-timer__row flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2 w-full">
        {blocks.map((block, i) => (
          <Fragment key={block.label}>
            <GiveawayTimeBlock value={block.value} label={block.label} index={i} />
            {i < blocks.length - 1 ? <GiveawaySeparator index={i} /> : null}
          </Fragment>
        ))}
      </div>

      <style jsx global>{`
        @keyframes giveawaySeparatorPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.4); }
        }
        .giveaway-separator-pulse { animation: giveawaySeparatorPulse 2.5s ease-in-out infinite; }

        @keyframes giveawayLiveDot {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.3); }
          50% { opacity: 1; box-shadow: 0 0 0 4px rgba(251, 191, 36, 0); }
        }
        .giveaway-live-dot { animation: giveawayLiveDot 2s ease-in-out infinite; }

        @keyframes giveawayShimmerSweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .giveaway-shimmer-sweep { animation: giveawayShimmerSweep 4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .giveaway-separator-pulse,
          .giveaway-live-dot,
          .giveaway-shimmer-sweep {
            animation: none !important;
          }
        }

        @media (max-width: 640px) {
          .giveaway-timer {
            max-width: 100%;
            margin-top: -2px;
          }
          .giveaway-timer__label {
            margin-bottom: 8px;
          }
          .giveaway-timer__row {
            gap: 4px;
          }
          .giveaway-timeblock > div {
            width: 64px;
            height: 74px;
            border-radius: 14px;
          }
          .giveaway-timeblock .tabular-nums {
            font-size: 26px;
          }
          .giveaway-timeblock__unit {
            margin-top: 8px;
            font-size: 9px;
            letter-spacing: 0.13em;
          }
        }
      `}</style>
    </div>
  );
}

export default function CountdownTimer({
  target,
  targetDate,
  label = "PRIJAVE SE ZATVARAJU ZA",
  theme = "default",
}: {
  target?: Date;
  targetDate?: Date;
  label?: string;
  theme?: CountdownTheme;
}) {
  const [defaultEndMs] = useState(() => Date.now() + 86400000);
  const resolvedTarget = targetDate ?? target ?? new Date(defaultEndMs);
  const targetMs = resolvedTarget.getTime();
  const safeTargetMs = Number.isFinite(targetMs) ? targetMs : defaultEndMs;

  const calc = () => {
    const diff = Math.max(0, safeTargetMs - Date.now());
    return {
      d: Math.floor(diff / 864e5),
      h: Math.floor((diff % 864e5) / 36e5),
      m: Math.floor((diff % 36e5) / 6e4),
      s: Math.floor((diff % 6e4) / 1e3),
      isFinished: diff <= 0,
    };
  };

  const [t, setT] = useState<TimerState>(() => calc());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const r = window.setTimeout(() => setReady(true), 0);
    const i = setInterval(() => setT(calc()), 1000);
    return () => {
      window.clearTimeout(r);
      clearInterval(i);
    };
  }, [safeTargetMs]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const items = [
    { v: ready ? t.d : 0, l: "DANA" },
    { v: ready ? t.h : 0, l: "SATI" },
    { v: ready ? t.m : 0, l: "MIN" },
    { v: ready ? t.s : 0, l: "SEK" },
  ];

  if (theme === "giveaway") {
    return <GiveawayTimer items={items} label={label} finished={ready && t.isFinished} />;
  }

  return (
    <div style={{ textAlign: "center", contain: "layout" }}>
      <style>{`
        .cd-label { font-size: 10px; letter-spacing: 0.15em; color: #8a8a9a; margin-bottom: 14px; text-transform: uppercase; font-weight: 500; }
        .cd-wrap { display: inline-flex; align-items: center; gap: 0; background: rgba(5,5,8,0.8); border: 1px solid rgba(0,212,255,0.2); border-radius: 18px; padding: 20px 28px; box-shadow: 0 0 40px rgba(0,212,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03); max-width: 100%; }
        .cd-num { font-size: clamp(28px, 8vw, 48px); font-weight: 700; color: #00d4ff; line-height: 1; font-variant-numeric: tabular-nums; }
        .cd-unit { font-size: 8px; color: #666; margin-top: 6px; letter-spacing: 0.12em; text-transform: uppercase; }
        .cd-item { text-align: center; min-width: clamp(40px, 10vw, 60px); }
        .cd-sep { font-size: clamp(24px, 6vw, 36px); color: rgba(0,212,255,0.25); font-weight: 200; margin: 0 4px; line-height: 1; margin-bottom: 14px; }
        @media (max-width: 380px) {
          .cd-wrap { padding: 14px 16px; border-radius: 14px; }
          .cd-sep { margin: 0 2px; }
        }
      `}</style>
      <p className="cd-label">{label}</p>
      <div className="cd-wrap">
        {items.map((item, i) => (
          <div key={item.l} style={{ display: "flex", alignItems: "center" }}>
            <div className="cd-item">
              <div className="cd-num">{pad(item.v)}</div>
              <div className="cd-unit">{item.l}</div>
            </div>
            {i < 3 && <span className="cd-sep">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
