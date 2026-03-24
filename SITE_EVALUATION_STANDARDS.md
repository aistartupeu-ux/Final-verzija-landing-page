# Ocena sajta po svetskim standardima

Kratka evaluacija **AI Hype Academy** sajta prema: Core Web Vitals / Lighthouse, WCAG (pristupačnost), SEO, bezbednost i best practices. Ocena je uslovna (bez pokretanja Lighthouse-a na live URL-u); zasniva se na pregledu koda i uobičajenim merilima.

---

## 1. Performanse (Core Web Vitals / Lighthouse)

| Kriterijum | Standard | Status | Napomena |
|------------|----------|--------|----------|
| **LCP** (Largest Contentful Paint) | &lt; 2.5 s | ✅ Dobre prakse | Hero video se učitava tek u viewportu (`preload="none"` + poster), logo ima `priority`; bez preload-a videa u `<head>` LCP bi trebalo da bude na tekstu/posteri. |
| **INP / FID** (Interactivity) | &lt; 100 ms | ✅ Ublaženo | Rate limit na API-ju, Sheet upisi sa await (bez prekida). Uklonjen je stalni canvas pozadin (`NetworkBackground`) sa glavnih stranica; manje kontinuiranog repaint-a na CPU/GPU. |
| **CLS** (Cumulative Layout Shift) | &lt; 0.1 | ⚠️ Proveriti | Slike preko `next/image` sa dimenzijama; video placeholder. Moguće trzanje ako neki element nema rezervisan prostor (npr. neki widget). |
| **First byte / TTFB** | Zavisi od hosta | ✅ | Vercel edge + serverless; statičke strane prerenderisane. |
| **Caching** | Duge cache za statiku | ✅ | `next.config`: mp4 7 dana, webp/avatars 1 godina. |

**Zaključak:** Kod je prilagođen performansama (lazy sekcije, lazy video `src` u showcase-u, bez globalnog canvas preload overhead-a). Za zvaničnu ocenu pokrenuti **Lighthouse** (Chrome DevTools ili PageSpeed Insights) na produkciji.

---

## 2. Pristupačnost (WCAG 2.1)

| Kriterijum | Standard | Status | Napomena |
|------------|----------|--------|----------|
| **Jezik stranice** | `lang` na `<html>` | ✅ | `lang="sr"`. |
| **Semantička struktura** | `main`, `header`, `nav`, `section`, naslovi | ✅ | `<main>`, `<header>`, `<nav>`, sekcije; h1/h2 korišćeni. |
| **Slike** | `alt` za sadržajne slike | ✅ | Logo, blog slike, placeholder – imaju `alt`. Dekorativni elementi `aria-hidden`. |
| **Forme** | Label povezan sa poljem ili `aria-label` | ⚠️ Poboljšati | Email/phone forma koristi samo `placeholder`; nema vidljivog `<label>` ili `aria-label` na inputu. Preporuka: dodati `<label for="...">` ili `aria-label` na polja. |
| **Fokus** | Vidljiv fokus za tastaturu | ⚠️ Proveriti | Nije uvek eksplicitno stilizovan `:focus-visible`. Preporuka: globalni outline za fokus (npr. `outline: 2px solid #00d4ff; outline-offset: 2px`). |
| **Skok na sadržaj** | Skip link | ❌ Nedostaje | Nema “Preskoči na sadržaj” linka na početku za korisnike tastature. Preporuka: prvi fokusabilan element link ka `#main` ili `main`. |
| **Animacije** | `prefers-reduced-motion` | ✅ | VideoShowcaseSection i ostatak UI-ja poštuju `prefers-reduced-motion: reduce` gde je implementirano. |
| **Žive regioni** | Aria live za dinamičke poruke | ✅ | UrgencyNotification: `role="status"`, `aria-live="polite"`. |
| **Dugmad** | Opis za screen readere | ⚠️ | Header “Join”, hamburger (Menu/X) – preporuka: `aria-label="Otvori meni"` / “Zatvori meni”, “Join The Hype”. |

**Zaključak:** Osnova je dobra (jezik, semantika, slike, reduced motion). Za **WCAG 2.1 AA** treba: labele/aria-label na formama, jasno vidljiv fokus, skip link, aria-label na akcionim dugmadima.

---

## 3. SEO

| Kriterijum | Standard | Status | Napomena |
|------------|----------|--------|----------|
| **Title / Description** | Jedinstven, opisno | ✅ | `metadata` u layout: title, description, keywords. |
| **Open Graph / Twitter** | OG i Twitter kartice | ✅ | OG title, description, url, image (1080x1080), locale `sr_RS`; Twitter card summary_large_image. |
| **Struktura naslova** | Jedan h1, logična hijerarhija | ⚠️ Proveriti | Na homepage jedan h1 u heroju; na podstranicama h1 po stranici. Proveriti da nema više h1 na jednoj stranici. |
| **Semantički HTML** | main, nav, section | ✅ | Korišćeni. |
| **URL-ovi** | Čitljivi, stabilni | ✅ | Next.js rute (`/join`, `/affiliate`, itd.). |
| **Canonical / hreflang** | Po potrebi | ⚠️ Opciono | Ako imaš više jezika ili duplikate, dodati canonical i hreflang. |

**Zaključak:** SEO je na dobrom nivou za jednu jezičku verziju. Za više jezika ili ogromne količine sadržaja – canonical i hreflang.

---

## 4. Bezbednost

| Kriterijum | Standard | Status | Napomena |
|------------|----------|--------|----------|
| **HTTPS** | Sve preko HTTPS | ✅ | Podrazumevano na Vercel-u. |
| **Tajne** | Nisu u frontendu | ✅ | API ključevi, service account – samo env na serveru. |
| **API zaštita** | Rate limit, validacija | ✅ | `/api/leads` (20/min), `/api/affiliate/track` (60/min), `/api/ai/generate` i `/api/ai/music` (10/min) – rate limit po IP; validacija ulaza. |
| **Security headers** | X-Frame-Options, CSP, itd. | ✅ | X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy; HSTS u produkciji; COEP/COOP na `/dashboard`. |
| **Cookies** | HttpOnly / Secure za osetljivo | ✅ | `special_access`, `af_ref` – podešeni path; Secure u produkciji. |

**Zaključak:** Osnova bezbedna (HTTPS, tajne na serveru, rate limit). Za jači profil – CSP i X-Frame-Options u next.config.

---

## 5. Best practices i UX

| Kriterijum | Standard | Status | Napomena |
|------------|----------|--------|----------|
| **Viewport / responsive** | Prilagođen uređaju | ⚠️ Namerno | `width=1280` u viewport meta – fiksna širina (desktop-first). Klasa `desktop-only` u body. Na mobilnim može biti horizontalni skrol ili skaliranje. Ako je cilj samo desktop, to je svesna odluka; inače preporuka: `width=device-width`. |
| **Slobodno korišćenje** | Bez blokiranja korisnika | ✅ | Nema blokiranja copy/paste; forme bez nepotrebnih prepreka. |
| **Greške u formi** | Jasna poruka, fokus na polje | ✅ | Poruke tipa “Došlo je do greške…”, “Greška u konekciji…”. |
| **Učitavanje / loading** | Indikator tokom slanja | ✅ | Loader na dugmetu dok traje submit. |
| **Pristup bez miša** | Tastatura / fokus | ⚠️ | Zavisi od :focus-visible i skip linka (vidi pristupačnost). |

---

## 6. Ukupna ocena (kratko)

- **Performanse:** Dobre prakse u kodu (lazy load, manje canvas opterećenja, cache). Za brojčanu ocenu – Lighthouse na live URL-u.
- **Pristupačnost:** Osnova dobra; za pun WCAG 2.1 AA – labele na formama, skip link, vidljiv fokus, aria-label na dugmadima.
- **SEO:** Jako dobro za single-language sajt (meta, OG, struktura).
- **Bezbednost:** Solidno (HTTPS, env, rate limit); opciono jači security headers.
- **Best practices:** U skladu sa namerom “desktop-first”; viewport 1280 je svesna odluka.

**Preporuke za brzi napredak:**  
1) Dodati `<label>` ili `aria-label` na email/phone polja u formi.  
2) Dodati “Preskoči na sadržaj” (skip to main) link.  
3) Eksplicitno stilizovati `:focus-visible` na linkovima i dugmadima.  
4) Na header dugmad (meni, Join) dodati `aria-label`.  
5) Na produkciji pokrenuti Lighthouse (Performance, Accessibility, Best Practices) i prilagoditi prema rezultatima.
