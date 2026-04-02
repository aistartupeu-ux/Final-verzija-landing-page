import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TrackingScripts from "@/components/layout/TrackingScripts";
import LandingAttribution from "@/components/layout/LandingAttribution";
import AffiliateTracker from "@/components/AffiliateTracker";
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AI Hype Academy | Izgradi AI karijeru",
  description: "Kompletan sistem za kreiranje AI influensera i filmskih videa za monetizaciju. Praktičan kurs za potpune početnike.",
  keywords: ["AI kurs", "AI influencer", "AI video", "monetizacija", "AI Hype Academy"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "AI Hype Academy | Izgradi AI karijeru",
    description: "Kompletan sistem za kreiranje AI influensera i filmskih videa za monetizaciju.",
    url: "https://aihype-academy.com",
    siteName: "AI Hype Academy",
    images: [
      {
        url: "https://aihype-academy.com/og-image.png",
        width: 1080,
        height: 1080,
        alt: "AI Hype Academy",
      },
    ],
    locale: "sr_RS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Hype Academy | Izgradi AI karijeru",
    description: "Kompletan sistem za kreiranje AI influensera i filmskih videa za monetizaciju.",
    images: ["https://aihype-academy.com/og-image.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : null;

  return (
    <html lang="sr">
      <head>
        <meta name="facebook-domain-verification" content="jcv01prpw9hx9y3ftd06dhdgksk3wr" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        {supabaseOrigin && (
          <>
            <link rel="dns-prefetch" href={supabaseOrigin} />
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
          </>
        )}
        <link rel="preload" href="/icon.png" as="image" />
        {/* Hero video se učitava u HeroSection kad je u viewportu — ne konkurisati sa LCP */}
      </head>
      <body className={inter.variable} style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", overflowX: "hidden", maxWidth: "100vw" }}>
        <LandingAttribution />
        <TrackingScripts />
        <AffiliateTracker />
        <div style={{ overflowX: "hidden", maxWidth: "100vw" }}>{children}</div>
      </body>
    </html>
  );
}
