"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type VerifyState = "idle" | "checking" | "valid" | "invalid";

type EmailVerifyResult = {
  state: VerifyState;
  error: string | null;
  check: (email: string) => void;
};

const DEBOUNCE_MS = 600;
const MIN_LENGTH = 6;

export function useEmailVerify(): EmailVerifyResult {
  const [state, setState] = useState<VerifyState>("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const check = useCallback((email: string) => {
    const trimmed = email.trim();
    if (trimmed.length < MIN_LENGTH || !trimmed.includes("@")) {
      setState("idle");
      setError(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setState("checking");
      setError(null);

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch(
          `/api/verify-email?email=${encodeURIComponent(trimmed)}`,
          { signal: abortRef.current.signal }
        );
        const data = await res.json();

        if (!res.ok) {
          setState("invalid");
          setError(data?.message ?? "Greška pri proveri emaila.");
          return;
        }

        if (data.valid) {
          setState("valid");
          setError(null);
        } else {
          setState("invalid");
          setError(data?.message ?? "Email nije validan.");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState("invalid");
        setError("Nismo mogli da proverimo email. Pokušajte ponovo.");
      } finally {
        timerRef.current = null;
      }
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { state, error, check };
}
