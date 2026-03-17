"use client";

import NetworkBackground from "@/components/ui/NetworkBackground";
import { SpotlightCursor } from "@/components/ui/spotlight-cursor";
import { useLowEndDevice } from "@/components/ui/useLowEndDevice";

export default function EffectsGate() {
  const lowEnd = useLowEndDevice();
  if (lowEnd) return null;

  return (
    <>
      <SpotlightCursor />
      <NetworkBackground />
    </>
  );
}

