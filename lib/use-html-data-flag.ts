"use client";

import { useSyncExternalStore } from "react";

/** Reaguje na postojanje data-atributa na `<html>` (npr. `data-hero-vsl-heavy`). */
export function useDocumentHtmlDataFlag(dataAttrName: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof document === "undefined") return () => {};
      const el = document.documentElement;
      const obs = new MutationObserver(onChange);
      obs.observe(el, { attributes: true, attributeFilter: [dataAttrName] });
      return () => obs.disconnect();
    },
    () =>
      typeof document !== "undefined" &&
      document.documentElement.hasAttribute(dataAttrName),
    () => false
  );
}
