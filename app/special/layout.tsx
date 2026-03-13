import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

/**
 * Special offer stranice (/special, /special/offer) su sačuvane ali NE aktivne.
 * Da ih uključiš: u Vercel → Environment Variables dodaj
 *   NEXT_PUBLIC_SPECIAL_OFFER_ENABLED = true
 * pa redeploy.
 */
const SPECIAL_ENABLED = process.env.NEXT_PUBLIC_SPECIAL_OFFER_ENABLED === "true";

export default function SpecialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!SPECIAL_ENABLED) {
    redirect("/");
  }
  return <div className={spaceGrotesk.variable}>{children}</div>;
}
