"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const NetworkBackground = dynamic(() => import("@/components/ui/NetworkBackground"), { ssr: false });
const SpotlightCursor = dynamic(
  () => import("@/components/ui/spotlight-cursor").then((m) => ({ default: m.SpotlightCursor })),
  { ssr: false }
);

/** Teški vizuelni efekti samo na desktopu — mobile skips za glatkoću. */
export default function DesktopOnlyEffects() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine) and (min-width: 768px)");
    const fn = () => setShow(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  if (!show) return null;
  return (
    <>
      <SpotlightCursor />
      <NetworkBackground />
    </>
  );
}
