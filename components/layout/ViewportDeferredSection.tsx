"use client";

import { useRef, useState, useEffect, startTransition, type ReactNode } from "react";
import SectionChunkFallback from "@/components/layout/SectionChunkFallback";

type Props = {
  children: ReactNode;
  /**
   * Proširenje root-a za IntersectionObserver (kao CSS margin).
   * Veće = ranije učitavanje; manje = manji pritisak na mrežu/CPU dok skroluješ.
   */
  rootMargin?: string;
  className?: string;
};

/**
 * Ne montira decu dok korisnik ne dođe blizu sekcije — JS chunk se tada tek vuče i parsira.
 * Sprečava „val“ učitavanja svih ispod-hero sekcija odjednom na prvom paint-u.
 */
export default function ViewportDeferredSection({
  children,
  rootMargin = "260px 0px 340px 0px",
  className,
}: Props) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || active) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        io.disconnect();
        startTransition(() => setActive(true));
      },
      { root: null, rootMargin, threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [active, rootMargin]);

  return (
    <div ref={ref} className={className} data-viewport-deferred={active ? "1" : "0"}>
      {active ? children : <SectionChunkFallback />}
    </div>
  );
}
