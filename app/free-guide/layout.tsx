import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Starter Kit — besplatan vodič | AI Hype Academy",
  description:
    "Preuzmi besplatan AI vodič: alati, content formula, projekti i monetizacija. Bez teorije.",
  robots: { index: false, follow: false },
};

export default function FreeGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
