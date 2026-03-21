# Detaljna analiza performansi sajta — AI Hype Academy

**Datum:** 21. mart 2026  
**Tehnologija:** Next.js 16.1.6 (Turbopack), React 19, Tailwind 4

---

## 1. Build i bundle

| Stavka | Status |
|--------|--------|
| Build vreme | ~17s kompilacija + ~0.6s generisanje stranica |
| Statičke stranice | 41 stranica prerenderovano (○) |
| Dinamičke rute | API rute (ƒ), ref/[code], special/offer |
| Bundle splitting | Dinamički import za below-fold sekcije |

### Code splitting (početna stranica)
- **Above-the-fold:** HeroSection, Header, Footer, ScrollProgress, DesktopOnlyEffects, EmailForm
- **Lazy loaded:** ProblemSection, SolutionSection, SocialProofSection, ForWhoSection, HowToEnterSection, FAQSection, FinalCTASection, BlogSection, AffiliateSection, VideoShowcaseSection

---

## 2. Performance — šta radi dobro

### 2.1 Optimizacije koje su implementirane

| Oblast | Implementacija |
|--------|----------------|
| **Scroll** | `scroll-behavior: auto` — manje lag-a pri brzom skrolu (smooth bi opterećivao main thread) |
| **Sekcije** | `content-visibility: auto` + `contain-intrinsic-size: auto 600px` na `main section` |
| **Hero video** | `preload="none"`, IntersectionObserver — učitava se kad je u viewportu |
| **Video showcase** | MAX_CONCURRENT_VIDEO_LOADS=1, MAX_CONCURRENT_VIDEO_PLAYS=3, throttling |
| **Paralaks video** | `requestAnimationFrame` throttling, `{ passive: true }` na scroll |
| **Preferiraj manje animacije** | `prefers-reduced-motion: reduce` poštovan u HeroSection, NetworkBackground, VideoShowcaseSection, SocialProofSection |
| **Desktop efekti** | NetworkBackground i SpotlightCursor samo na desktopu (pointer: fine, min-width: 768px) |
| **Slike** | Next/Image sa AVIF, WebP, `minimumCacheTTL: 31536000` |
| **Font** | Inter preko `next/font/google` — samo latin, latin-ext |
| **Prefetch** | DNS prefetch + preconnect za Supabase |

### 2.2 Core Web Vitals — podešeno za

- **LCP:** Hero video se ne učitava odmah (IntersectionObserver), LCP može biti tekst ili poster
- **FID/INP:** `passive: true` na scroll listenerima
- **CLS:** `contain`, `content-visibility`, slike sa dimenzijama (Next Image)
- **Smoothness:** RAF throttling, `transform` umesto layout properties

---

## 3. Rizici i preporuke za optimizaciju

### 3.1 Third-party skripte (visok prioritet)

**Problem:** Meta Pixel, GTM i TikTok Pixel učitavaju se sa `strategy="afterInteractive"` — sve tri odmah nakon interaktivnosti.

**Preporuke:** (implementirano 2026-03-21)
- GTM i TikTok: preći na `strategy="lazyOnload"` ✅
- Meta Pixel: ostaviti `afterInteractive` ✅
- Razmotriti Google Tag Server-Side (GTM SSR) za manje blocking na klijentu (buduće)

### 3.2 Teške zavisnosti

| Paket | Napomena |
|-------|----------|
| `@ffmpeg/ffmpeg` + `@ffmpeg/util` | Koristi se u dashboard/studio — treba dinamički import samo na tim stranicama |
| `react-phone-number-input` | Uvodi ceo set zemalja; učitava se u EmailForm (above-the-fold) — razmotriti lazy load forme ili lighter alternativu |
| `framer-motion` | Koristi se širom sajta — bundle je veći, ali tree-shaking pomaže |
| `googleapis` | Server-side, nema uticaja na klijent |

**Preporuka:** EmailForm je u hero — razmotriti `dynamic(() => import("./EmailForm"), { ssr: false })` sa placeholder-om ako je LCP prioritet.

### 3.3 Video i slike

| Asset | Napomena |
|-------|----------|
| `/hero-vsl.mp4` | LCP kandidat — učitava se kad je sekcija u viewportu, dobro |
| `/explainer-vsl.mp4` | `preload="none"` — učitava se na play, dobro |
| 16 example videja u VideoShowcaseSection | Throttling na 1 concurrent load, 3 concurrent plays — dobro |
| Plexus pozadine (pozadina-plexus*.png) | Velike slike — proveriti da li su kompresovane (WebP/AVIF) |
| Blog slike (blog-trile-*.png, blog-rok-*.webp) | Učitavaju se u BlogSection (lazy) — OK |

**Preporuka:** Proveriti veličine plexus slika; ako su >200KB, razmotriti WebP ili manje rezolucije.

### 3.4 `will-change` i `transform`

- **ScrollProgress bar:** `will-change: transform` — OK, mali element
- **Header:** `will-change: transform` na celom headeru — može izazvati dodatni composite layer; razmotriti uklanjanje ako nema vizuelnih problema
- **VideoShowcaseSection:** `will-change: transform` samo kad je `inView` — dobro

### 3.5 Ostalo

- **icon.png preload:** U layoutu se preload-uje `/icon.png` — OK za favicon
- **Middleware deprecation:** Next.js upozorava na deprecated "middleware" — planirati migraciju na "proxy" kada bude stabilno
- **TrackingScripts:** GTM se učitava čak i kad nema env var (fallback ID) — uvek se izvršava; ako želiš da tracking bude opcioni, ukloniti fallback i proveravati env

---

## 4. Opterećenost (load)

| Stavka | Procena |
|--------|---------|
| Inicijalni JS | Umeren — code splitting solidan |
| Third-party | Visok — 3 tracking skripte odmah |
| Network zahtevi | Hero: 1 video (lazy), 1 explainer (lazy), pozadina fallback; ostalo chunk-ovano |
| Main thread | RAF throttling, passive scroll — dobro |

**Preporuka:** Na 3G/4G third-party skripte mogu zakašnjavati FCP/INP; prioritizovati `lazyOnload` za sve osim Meta Pixel ako je konverzija ključna.

---

## 5. Smoothness (glatkoća)

| Oblast | Implementacija |
|--------|----------------|
| Scroll | `scroll-behavior: auto`, passive listeners, RAF |
| Animacije | Framer Motion, `prefers-reduced-motion` poštovan |
| Video parallax | RAF throttling, `translateZ(0)` za GPU |
| Marquee/ticker | `will-change: transform` samo kad je inView |
| Kartice/hover | `transform: translate3d` umesto `top`/`left` |

**Napomena:** `scroll-behavior: auto` je namerno — `smooth` može izazvati frame drops pri brzom skrolu na mobilnim uređajima.

---

## 6. Struktura assets-a (public/)

- **Videja:** hero-vsl, explainer-vsl, 16 examples + ostala (hero-trailer, hero-video, hero-srbija)
- **Slike:** plexus pozadine, blog thumbs, og-image
- **Raspored:** OK; obratiti pažnju na duplikate (npr. blog-rok-4-up.jpg i .webp)

---

## 7. Zaključak i akcioni plan

### Kratkoročno (niska naporna)
1. Prebaciti GTM i TikTok na `lazyOnload` ako business dozvoljava
2. Proveriti veličine plexus i blog slika; kompresovati ako treba
3. Ukloniti `will-change` sa headera ako nema vidljive razlike

### Srednjoročno
4. Lazy load EmailForm ili bar PhoneInput dela
5. Migracija na Next.js "proxy" umesto middleware kada bude stable
6. Razmotriti Server-Side GTM za manje blocking-a

### Monitoring
7. Koristiti Vercel Analytics / Web Vitals za praćenje LCP, FID, CLS
8. Lighthouse audit (mobile + desktop) jednom mesečno
9. Test na realnim 3G brzinama (Chrome DevTools throttling)

---

*Izveštaj generisan na osnovu analize koda, build output-a i poznatih best practices za Next.js i Core Web Vitals.*
