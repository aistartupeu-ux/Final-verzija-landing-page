"use client";

import CountdownTimerUI from "@/components/ui/CountdownTimer";

type CountdownTheme = "default" | "giveaway";

interface CountdownTimerProps {
  target: Date;
  label?: string;
  theme?: CountdownTheme;
}

export default function CountdownTimer({ target, label, theme = "default" }: CountdownTimerProps) {
  return <CountdownTimerUI targetDate={target} label={label} theme={theme} />;
}
