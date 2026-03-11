"use client";
import { useEffect, useState } from "react";
import { X, TrendingUp } from "lucide-react";

interface LocationData {
  city: string;
  country_name: string;
  country_code: string;
}

const countryToFlag = (code: string) =>
  code
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));

// Map English city names → local names
const CITY_LOCAL: Record<string, string> = {
  Belgrade: "Beograd",
  "Novi Sad": "Novi Sad",
  Niš: "Niš",
  Nis: "Niš",
  Kragujevac: "Kragujevac",
  Subotica: "Subotica",
  Čačak: "Čačak",
  Cacak: "Čačak",
  Leskovac: "Leskovac",
  Kruševac: "Kruševac",
  Krusevac: "Kruševac",
  Valjevo: "Valjevo",
  Vranje: "Vranje",
  Zrenjanin: "Zrenjanin",
  Šabac: "Šabac",
  Sabac: "Šabac",
  Pančevo: "Pančevo",
  Pancevo: "Pančevo",
  Sombor: "Sombor",
  Užice: "Užice",
  Uzice: "Užice",
  Smederevo: "Smederevo",
  Jagodina: "Jagodina",
  Pirot: "Pirot",
  // Croatia
  Zagreb: "Zagreb",
  Split: "Split",
  Rijeka: "Rijeka",
  Osijek: "Osijek",
  Zadar: "Zadar",
  // Bosnia
  Sarajevo: "Sarajevo",
  "Banja Luka": "Banja Luka",
  Mostar: "Mostar",
  Tuzla: "Tuzla",
  Zenica: "Zenica",
  // Slovenia
  Ljubljana: "Ljubljana",
  Maribor: "Maribor",
  // Montenegro
  Podgorica: "Podgorica",
  // North Macedonia
  Skopje: "Skoplje",
  // Germany
  Berlin: "Berlin",
  Munich: "München",
  Hamburg: "Hamburg",
  Frankfurt: "Frankfurt",
  Cologne: "Köln",
  Stuttgart: "Stuttgart",
  Düsseldorf: "Düsseldorf",
  Dortmund: "Dortmund",
  // Austria
  Vienna: "Beč",
  Wien: "Beč",
  Graz: "Graz",
  Linz: "Linz",
  // Switzerland
  Zurich: "Cirih",
  Geneva: "Ženeva",
  Bern: "Bern",
  // UK
  London: "London",
  Manchester: "Manchester",
  Birmingham: "Birmingham",
  // USA
  "New York": "Njujork",
  "New York City": "Njujork",
  Chicago: "Čikago",
  "Los Angeles": "Los Anđeles",
  Houston: "Hjuston",
  // Canada
  Toronto: "Toronto",
  Vancouver: "Vankuver",
  Montreal: "Monreal",
  // Australia
  Sydney: "Sidnej",
  Melbourne: "Melburn",
  // Sweden
  Stockholm: "Stokholm",
  // Norway
  Oslo: "Oslo",
  // Denmark
  Copenhagen: "Kopenhagen",
  // Netherlands
  Amsterdam: "Amsterdam",
  // France
  Paris: "Pariz",
  // Italy
  Rome: "Rim",
  Milan: "Milano",
};

const localizeCity = (city: string) => CITY_LOCAL[city] ?? city;

const getEnrollmentCount = (city: string) => {
  const seed = (Date.now() / 3_600_000) | 0;
  const hash = (city + seed).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 8 + (hash % 29); // 8–36
};

export default function UrgencyNotification() {
  const [loc, setLoc] = useState<LocationData | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    fetch("/api/geo")
      .then((r) => r.json())
      .then((data: LocationData & { error?: string }) => {
        if (data.error) return;
        if (data.city && data.country_code) {
          setLoc(data);
          timer = setTimeout(() => setVisible(true), 3500);
        }
      })
      .catch(() => {});

    return () => clearTimeout(timer);
  }, []);

  if (!loc || dismissed) return null;

  const flag = countryToFlag(loc.country_code);
  const city = localizeCity(loc.city);
  const count = getEnrollmentCount(loc.city);
  const label = count === 1 ? "osoba" : count < 5 ? "osobe" : "osoba";

  return (
    <>
      <style>{`.urgency-toast{animation:toastIn 0.45s cubic-bezier(0.22,1,0.36,1) both}`}</style>

      <style>{`.urgency-toast-pos{bottom:20px;left:20px}@media(max-width:767px){.urgency-toast-pos{bottom:auto;top:80px;left:12px;right:12px;maxWidth:none}}`}</style>
      <div
        className="urgency-toast urgency-toast-pos"
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          zIndex: 9999,
          display: visible ? "flex" : "none",
          alignItems: "center",
          gap: 10,
          background: "rgba(8,8,18,0.96)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "12px 14px",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.05) inset",
          maxWidth: 300,
          width: "calc(100vw - 40px)",
        }}
      >
        {/* Flag + live dot */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, lineHeight: 1,
          }}>
            {flag}
          </div>
          {/* Live dot */}
          <div style={{
            position: "absolute", top: -3, right: -3,
            width: 10, height: 10,
          }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "#22c55e",
              animation: "live-ping 1.4s ease-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 1, borderRadius: "50%",
              background: "#22c55e",
            }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <TrendingUp size={11} color="#22c55e" />
            <span style={{ fontSize: 10, fontWeight: 600, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Uživo
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.35 }}>
            <span style={{ color: "#00d4ff" }}>{count} {label}</span>
            {" iz "}
            <span style={{ color: "#fff" }}>{city}</span>
            {" se prijavilo danas"}
          </div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
            AI Hype Academy · Ograničena mesta
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Zatvori"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#444", padding: 4, display: "flex", alignItems: "center",
            flexShrink: 0, alignSelf: "flex-start", borderRadius: 6,
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#888")}
          onMouseLeave={e => (e.currentTarget.style.color = "#444")}
        >
          <X size={13} />
        </button>
      </div>
    </>
  );
}
