import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Special Offer | AI Hype Academy",
  robots: "noindex, nofollow",
};

export default function SpecialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={spaceGrotesk.variable}>{children}</div>;
}
