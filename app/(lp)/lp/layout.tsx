import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Hype Academy — Waitlist",
  robots: { index: false, follow: false },
};

export default function LpLayout({ children }: { children: React.ReactNode }) {
  return children;
}

