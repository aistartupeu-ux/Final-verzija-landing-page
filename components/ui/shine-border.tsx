"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ShineBorderProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  borderWidth?: number;
  duration?: number;
  /** Conic gradient colors (CSS color values). Defaults to site accent green + cyan + purple. */
  gradientColors?: string[];
};

const DEFAULT_GRADIENT = ["#A3FF12", "#00d4ff", "#7c3aed", "#A3FF12"];

export function ShineBorder({
  children,
  className,
  contentClassName,
  contentStyle,
  borderWidth = 2,
  duration = 4,
  gradientColors = DEFAULT_GRADIENT,
}: ShineBorderProps) {
  const conicGradient = `conic-gradient(from 0deg, ${gradientColors.join(", ")})`;

  return (
    <div
      className={cn("relative rounded-2xl w-full max-w-[520px] mx-auto", className)}
      style={{ padding: borderWidth }}
    >
      {/* Animated gradient layer */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div
          className="absolute -inset-[100%] blur-sm animate-spin"
          style={{
            background: conicGradient,
            animationDuration: `${duration}s`,
          }}
        />
      </div>

      {/* Content layer — slightly smaller radius so gradient border is visible */}
      <div
        className={cn("relative w-full h-full flex flex-col", contentClassName)}
        style={{
          borderRadius: `calc(1.25rem - ${borderWidth}px)`,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
