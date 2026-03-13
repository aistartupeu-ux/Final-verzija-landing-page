"use client";

import { useEffect } from "react";
import { initAffiliateTracking, trackClickOnce } from "@/lib/affiliate-tracking";

/** Na mount: hvata ref iz URL-a, šalje click event (1x po visitor). Renders nothing. */
export default function AffiliateTracker() {
  useEffect(() => {
    initAffiliateTracking();
    trackClickOnce();
  }, []);
  return null;
}
