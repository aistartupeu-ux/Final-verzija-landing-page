import type { Metadata } from "next";
import { Suspense } from "react";
import ThankYouClient from "./ThankYouClient";

export const metadata: Metadata = {
  title: "Uspešno! | AI Hype Academy",
  description: "Na listi si. Proveri inbox za dalje informacije.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouClient />
    </Suspense>
  );
}

