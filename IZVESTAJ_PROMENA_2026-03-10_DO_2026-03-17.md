# Izveštaj promena na web sajtu (10.03.2026 → 17.03.2026)

Ovaj dokument je automatski sastavljen iz istorije repozitorijuma (`git log`) i kratkog opisa funkcionalnih izmena.

## Važno (šta znači “sve promene”)

- **100% obuhvaćeno**: sve što je **commit-ovano** u git istoriji između 10.03 i 17.03 (svaki commit + lista fajlova u appendix-u ispod).
- **Nije obuhvaćeno automatski**: sve što je rađeno **lokalno ali nije commit-ovano** (npr. fajlovi koji su ostali `untracked` ili su kasnije obrisani pre commita). To možemo posebno dodati, ali mora se uzeti iz lokalnog `git status` u tom trenutku (git istorija to ne pamti).

## Sažetak (šta je rađeno)

- **Leads / EmailForm / Supabase**: popravljene greške na submitu, poruke uspeha, logovanje grešaka i Supabase insert payload (uklonjen `name`).
- **HighLevel (GHL)**: dodat webhook flow i podešavanja/UPUTSTVO za setup; izbačen Resend welcome email (da samo GHL šalje).
- **UTM & “Leads by Source”**: praćenje izvora lead-a (UTM/click IDs), webhook integracije i pomoćne debug rute.
- **Affiliate tracking**: tracking klikova/leadova/konverzija, Sheet statistike i “ref” sistem.
- **Tracking skripte**: Google Analytics (GA) ID dodat/standardizovan; Meta Pixel poboljšanja (fallback ID, Lead event).
- **Blog sekcija**: slideshow slike, per-slide crop (`objectPosition`), ubrzano rotiranje i zamena/optimizacija slika.
- **Video showcase**: optimizacije učitavanja (lazy/in-view), touch drag, full-bleed na desktopu i zamena setova videa.
- **Performanse**: smanjeno seckanje na slabijim uređajima (low-end gating), optimizovan ticker/progress refresh, canvas efekti i scroll.
- **UI/Responsive**: viewport i mobilni header tweaks, countdown i progress bar refinements.

## Hronologija po datumima (ključni deploy-evi)

### 11.03.2026
- **Hero / Blog / VideoShowcase**: uvedeni hero videi, BlogSection sa slideshow, i VideoShowcase sekcija sa primerima.
- **Tracking**: uveden Meta Pixel + `og:image` i globalne tracking skripte (`components/layout/TrackingScripts.tsx`).
- **Plexus background**: vizuelna pozadina na sekcijama.

### 12.03.2026
- **Live update (integracije + optimizacije)**: više frontpage optimizacija, mobile CTA izmene, scroll perf.
- **Video showcase**: full-bleed na desktop, mobile swipe/drag, lazy load, logo fallback.
- **Countdown/Progress**: uveden progress bar countdown i optimizacije skrol eventova.

### 13.03.2026
- **Leads API**: bolje logovanje Supabase grešaka i validacija env var-ova.
- **Supabase schema fix**: uklonjen `name` iz insert-a jer kolona nije postojala (`PGRST204`).
- **EmailForm**: success copy + prikaz greške; phone postavljen kao opcion.
- **Leads by Source**: UTM tracking + setup dokumentacija; pomoćna `sheet-status` ruta.
- **Special offer**: isključivanje i redirekcija; prelazak na direktan upis u Google Sheet.

### 15.03.2026
- **Live counter**: logika za “max join dnevno”.
- **Affiliate sheet bez Make** + više uputstava/dokumenata.
- **UI/Perf**: tajmer usklađen (15.04 00:00), scroll optimizacije, čišćenje komponenti.

### 16.03.2026
- **Rate limit & async**: optimizovan `/api/leads` i affiliate tracking da vraćaju brže response (async Sheet/GHL).
- **SpotlightCursor**: “smooth” animacija i cleanup event listenera.
- **Waitlist counter**: stabilniji rast (nikad ne ide unazad u istom browseru).
- **Responsive**: `device-width` viewport i mobilni header tweak.

### 17.03.2026
- **GA tag**: dodat GA measurement ID `G-87RPG6JR4B` u `TrackingScripts`.
- **BlogSection**: trim slika + brži slideshow, per-slide crop pozicije, zamena slika (Rok/Trile), upscaling/optimizacije.
- **Video set update**: zamena/optimizacija `public/examples` videa i podešavanje redova u `VideoShowcaseSection`.
- **Perf (scroll jank)**:
  - uveden `EffectsGate` (gasi `SpotlightCursor` i `NetworkBackground` na low-end uslovima),
  - vraćen “heavy gating” na ticker/progress (offscreen/low-end),
  - finalni hotfix commit da se smanji kočenje na slabijim laptopovima.

## Lista commitova (10.03 → 17.03.2026)

Napomena: format je `hash | datum | poruka`.

```text
62bfb0b | 2026-03-17 | perf: re-enable low-end gating
77779e2 | 2026-03-17 | perf: smooth showcase and cut low-end effects
905c111 | 2026-03-17 | perf: smooth VideoShowcase and SocialProof
c49ab4e | 2026-03-17 | perf: reduce scroll jank and refresh showcase videos
c3db5fe | 2026-03-17 | BlogSection: trim slides and speed up rotation
af3ceb4 | 2026-03-17 | BlogSection: per-slide crop and updated hero images
91ea051 | 2026-03-17 | BlogSection: add Rok slideshow images
2fb1f72 | 2026-03-17 | Add Google Analytics tag (G-87RPG6JR4B)
9fb20b2 | 2026-03-17 | perf: VideoShowcase + sections below - will-change only inView, content-visibility, plexus contain
b40b8fc | 2026-03-16 | responsive: device-width viewport, remove desktop-only, mobile header font 14px
9e4c687 | 2026-03-16 | perf: spotlight listener cleanup, rate map memory cap, stress test doc update
c065383 | 2026-03-16 | Fix: await Sheet appends so Clicks/Leads/Conversions populate on Vercel
bbf14cc | 2026-03-16 | Smooth spotlight cursor animation
20c4a3c | 2026-03-16 | Waitlist counter: max 40/day and never decrease per browser
335c365 | 2026-03-16 | Optimize frontpage performance and fix waitlist counter base
a7f7b66 | 2026-03-16 | Leads & affiliate: rate limit + async GHL/Sheet (fast response, no behavior change)
a30f9fd | 2026-03-16 | Affiliate & leads: lowercase codes, sheet conversions, GHL webhook - no behavior change
b6a2910 | 2026-03-16 | Add Loader.io verification file and stress test script
0822ba4 | 2026-03-15 | Live: max 50 join dnevno (live counter)
6de2cd7 | 2026-03-15 | Live: tajmer 15.04 00:00, desktop-only, scroll optimizations, affiliate Sheet bez Make, doc updates
aeeea5d | 2026-03-13 | EmailForm: bez redirect-a posle submita, ostaje poruka potvrde
5d901bd | 2026-03-13 | Leads Sheet: auto-detect sheet tab name (Lista 1, Sheet1)
250553c | 2026-03-13 | Leads Sheet: private_key fix, bolji error log, sheet-status debug route
e241199 | 2026-03-13 | Special offer OFF (redirect na /), direktan Google Sheet upis, leads-sheet lib
71644ee | 2026-03-13 | Leads by Source: UTM tracking, webhook za Make, kompletan setup vodic
b026688 | 2026-03-13 | Remove Resend welcome email - only HighLevel sends
ee16f4a | 2026-03-13 | EmailForm: update success confirmation copy
d642a08 | 2026-03-13 | leads API: remove name from Supabase insert (column not in schema)
6a84fbf | 2026-03-13 | leads API: log full Supabase error (code, message, details, hint) for debugging
f217a65 | 2026-03-13 | EmailForm: success message, error feedback, leads API Supabase env validation
11adb41 | 2026-03-13 | HighLevel webhook, EmailForm submit fix (phone optional), HIGLEVEL_SETUP.md
6f0d401 | 2026-03-12 | Progress bar countdown, scroll perf (debounce video, RAF), Meta Pixel fallback ID
c7c138c | 2026-03-12 | Mobile CTA: remove 'Ograničen broj mesta' text
b4fdad4 | 2026-03-12 | Video showcase: full bleed PC, unlimited mobile scroll, lazy load, logo fallback - CHANGELOG updated
6f7f2f4 | 2026-03-12 | Live update: integrations, Meta Pixel, Join, touch swipe, platform optimizations
549640a | 2026-03-11 | Hero: hero-trailer.mp4 (1:19), redosled: Blog pa VideoShowcase
6cc59da | 2026-03-11 | VideoShowcase: logo fallback, ivice prazne, kontinuirana rotacija
eee54e1 | 2026-03-11 | Update: Hero video, countdown, Problem sekcija, Trile slike - vidi CHANGELOG.md
53307e9 | 2026-03-11 | Update: Header nav (O nama), Footer (TikTok, remove Twitter/LinkedIn/Cene), Blog section title, Trile/Rok Instagram links
1e7e573 | 2026-03-11 | Update: BlogSection (Trile CEO, Rok PM, Milivojka vest, slideshow), Meta Pixel Lead, deploy docs, plexus bg, video examples
00f4ff6 | 2026-03-11 | Design: Meta Pixel, og:image, affiliate links typo
```

## Bitno: šta NIJE gurnuto live

- `/lp` landing page radovi su ostali lokalno (nije commit-ovano u “live” tok dok se ne završi).
- `middleware.ts` (soft-gate za `/lp`) nije uključen u live push kada je traženo da se `/lp` izostavi.
- Lokalni test fajlovi (`tmp/*`) i privatne beleške nisu uključene.

## Appendix A — Sve promene po commitu (fajlovi M/A/D)

U nastavku je “full fidelity” spisak fajlova po commitu u periodu 10.03 → 17.03 (M=modified, A=added, D=deleted).

### 62bfb0b (2026-03-17) perf: re-enable low-end gating
- **M** `components/sections/SocialProofSection.tsx`
- **M** `components/sections/VideoShowcaseSection.tsx`
- **M** `components/ui/EffectsGate.tsx`
- **A** `components/ui/useLowEndDevice.ts`

### 77779e2 (2026-03-17) perf: smooth showcase and cut low-end effects
- **M** `components/sections/SocialProofSection.tsx`
- **M** `components/sections/VideoShowcaseSection.tsx`
- **M** `components/ui/EffectsGate.tsx`
- **D** `components/ui/useLowEndDevice.ts`

### 905c111 (2026-03-17) perf: smooth VideoShowcase and SocialProof
- **M** `components/sections/SocialProofSection.tsx`
- **M** `components/sections/VideoShowcaseSection.tsx`
- **M** `components/ui/EffectsGate.tsx`
- **A** `components/ui/useLowEndDevice.ts`

### c49ab4e (2026-03-17) perf: reduce scroll jank and refresh showcase videos
- **M** `app/page.tsx`
- **M** `components/sections/HeroSection.tsx`
- **M** `components/sections/VideoShowcaseSection.tsx`
- **A** `components/ui/EffectsGate.tsx`
- **M** `components/ui/NetworkBackground.tsx`
- **M** `public/examples/v1.mp4`
- **M** `public/examples/v2.mp4`
- **M** `public/examples/v3.mp4`
- **M** `public/examples/v4.mp4`
- **M** `public/examples/v5.mp4`
- **M** `public/examples/v6.mp4`
- **M** `public/examples/v7.mp4`
- **M** `public/examples/v8.mp4`
- **M** `public/examples/v9.mp4`
- **M** `public/examples/v10.mp4`

### c3db5fe (2026-03-17) BlogSection: trim slides and speed up rotation
- **M** `components/sections/BlogSection.tsx`

### af3ceb4 (2026-03-17) BlogSection: per-slide crop and updated hero images
- **M** `components/sections/BlogSection.tsx`
- **A** `public/blog-rok-4-up.webp`
- **A** `public/blog-trile-4b.jpg`

### 91ea051 (2026-03-17) BlogSection: add Rok slideshow images
- **M** `components/sections/BlogSection.tsx`
- **A** `public/blog-rok-2.webp`
- **A** `public/blog-rok-3.webp`
- **A** `public/blog-rok-4.jpg`
- **A** `public/blog-rok-5.jpg`

### 2fb1f72 (2026-03-17) Add Google Analytics tag (G-87RPG6JR4B)
- **M** `components/layout/TrackingScripts.tsx`

### 9fb20b2 (2026-03-17) perf: VideoShowcase + sections below - will-change only inView, content-visibility, plexus contain
- **M** `app/globals.css`
- **M** `components/sections/BlogSection.tsx`
- **M** `components/sections/FAQSection.tsx`
- **M** `components/sections/FinalCTASection.tsx`
- **M** `components/sections/ForWhoSection.tsx`
- **M** `components/sections/HowToEnterSection.tsx`
- **M** `components/sections/SocialProofSection.tsx`
- **M** `components/sections/VideoShowcaseSection.tsx`

### b40b8fc (2026-03-16) responsive: device-width viewport, remove desktop-only, mobile header font 14px
- **M** `app/layout.tsx`
- **M** `components/layout/Header.tsx`

### 9e4c687 (2026-03-16) perf: spotlight listener cleanup, rate map memory cap, stress test doc update
- **M** `STRESS_TEST_UPUTSTVO.md`
- **M** `app/api/affiliate/track/route.ts`
- **M** `app/api/leads/route.ts`
- **M** `components/ui/NetworkBackground.tsx`
- **M** `components/ui/ScrollProgress.tsx`
- **M** `components/ui/spotlight-cursor.tsx`

### c065383 (2026-03-16) Fix: await Sheet appends so Clicks/Leads/Conversions populate on Vercel
- **M** `app/api/affiliate/track/route.ts`
- **M** `app/api/leads/route.ts`

### bbf14cc (2026-03-16) Smooth spotlight cursor animation
- **M** `components/ui/spotlight-cursor.tsx`

### 20c4a3c (2026-03-16) Waitlist counter: max 40/day and never decrease per browser
- **M** `components/sections/SocialProofSection.tsx`

### 335c365 (2026-03-16) Optimize frontpage performance and fix waitlist counter base
- **M** `STRESS_TEST_UPUTSTVO.md`
- **M** `app/layout.tsx`
- **M** `components/sections/HeroSection.tsx`
- **M** `components/sections/SocialProofSection.tsx`
- **M** `components/sections/VideoShowcaseSection.tsx`
- **M** `components/ui/NetworkBackground.tsx`
- **M** `components/ui/spotlight-cursor.tsx`
- **M** `next.config.ts`

### a7f7b66 (2026-03-16) Leads & affiliate: rate limit + async GHL/Sheet (fast response, no behavior change)
- **M** `app/api/affiliate/track/route.ts`
- **M** `app/api/leads/route.ts`

### a30f9fd (2026-03-16) Affiliate & leads: lowercase codes, sheet conversions, GHL webhook - no behavior change
- **M** `app/api/affiliate/conversion/route.ts`
- **M** `app/api/affiliate/track/route.ts`
- **M** `app/api/leads/route.ts`
- **M** `app/ref/[code]/route.ts`
- **M** `lib/affiliate-sheet.ts`
- **M** `lib/affiliate-tracking.ts`
- **M** `lib/affiliate.ts`

### b6a2910 (2026-03-16) Add Loader.io verification file and stress test script
- **A** `STRESS_TEST_UPUTSTVO.md`
- **A** `public/loaderio-e67230e52c59cbe33f6a90fc8492991c.txt`
- **A** `scripts/stress-test.js`

### 0822ba4 (2026-03-15) Live: max 50 join dnevno (live counter)
- **M** `components/sections/SocialProofSection.tsx`

### 6de2cd7 (2026-03-15) Live: tajmer 15.04 00:00, desktop-only, scroll optimizations, affiliate Sheet bez Make, doc updates
- **A** `AFFILIATE_MAPIRANJE_GHL.md`
- **A** `AFFILIATE_SETUP.md`
- **A** `AFFILIATE_SHEET_BEZ_MAKE.md`
- **M** `CHANGELOG_PRE_LIVE.md`
- **A** `CHECKLIST_AFFILIATE.md`
- **A** `GHL_LEADS_POJASNJENJE.md`
- **M** `LEADS_BY_SOURCE_SETUP.md`
- **M** `PREGLED_TOKENA_I_TAGOVA.md`
- **M** `PRE_DEPLOY_CHECKLIST.md`
- **M** `UPUTSTVO.md`
- **M** `UPUTSTVO.txt`
- **M** `UPUTSTVO_DEPLOY.md`
- **M** `UPUTSTVO_DEPLOY.txt`
- **A** `app/api/affiliate/sheet-status/route.ts`
- **A** `app/api/affiliate/track/route.ts`
- **D** `app/api/chat/route.ts`
- **M** `app/globals.css`
- **M** `app/layout.tsx`
- **M** `app/page.tsx`
- **M** `app/ref/[code]/route.ts`
- **M** `app/special/layout.tsx`
- **M** `app/special/offer/page.tsx`
- **M** `app/special/page.tsx`
- **M** `components/layout/Header.tsx`
- **M** `components/layout/TrackingScripts.tsx`
- **M** `components/sections/HeroSection.tsx`
- **M** `components/sections/SocialProofSection.tsx`
- **D** `components/ui/ChatBubble.tsx`
- **M** `components/ui/NetworkBackground.tsx`
- **M** `components/ui/ScrollProgress.tsx`
- **A** `components/ui/moving-border.tsx`
- **A** `components/ui/shine-border.tsx`
- **A** `email-nurture-1.html`
- **A** `lib/affiliate-sheet.ts`
- **A** `lib/utils.ts`

### aeeea5d (2026-03-13) EmailForm: bez redirect-a posle submita, ostaje poruka potvrde
- **M** `components/ui/EmailForm.tsx`

### 5d901bd (2026-03-13) Leads Sheet: auto-detect sheet tab name (Lista 1, Sheet1)
- **A** `LEADS_SHEET_SETUP_DETALJNO.md`
- **M** `lib/leads-sheet.ts`

### 250553c (2026-03-13) Leads Sheet: private_key fix, bolji error log, sheet-status debug route
- **M** `LEADS_BY_SOURCE_KOMPLETAN_SETUP.md`
- **A** `app/api/leads/sheet-status/route.ts`
- **M** `lib/leads-sheet.ts`

### e241199 (2026-03-13) Special offer OFF (redirect na /), direktan Google Sheet upis, leads-sheet lib
- **M** `LEADS_BY_SOURCE_KOMPLETAN_SETUP.md`
- **M** `app/api/leads/route.ts`
- **M** `app/api/special/access/route.ts`
- **M** `app/special/layout.tsx`
- **M** `components/ui/EmailForm.tsx`
- **A** `lib/leads-sheet.ts`
- **M** `package-lock.json`
- **M** `package.json`

### 71644ee (2026-03-13) Leads by Source: UTM tracking, webhook za Make, kompletan setup vodic
- **A** `LEADS_BY_SOURCE_KOMPLETAN_SETUP.md`
- **A** `LEADS_BY_SOURCE_SETUP.md`
- **M** `app/api/leads/route.ts`
- **A** `app/api/special/access/route.ts`
- **M** `app/join/page.tsx`
- **M** `app/layout.tsx`
- **A** `app/special/layout.tsx`
- **A** `app/special/offer/page.tsx`
- **A** `app/special/page.tsx`
- **A** `components/AffiliateTracker.tsx`
- **M** `components/ui/EmailForm.tsx`
- **A** `lib/affiliate-tracking.ts`

### b026688 (2026-03-13) Remove Resend welcome email - only HighLevel sends
- **M** `app/api/leads/route.ts`

### ee16f4a (2026-03-13) EmailForm: update success confirmation copy
- **M** `components/ui/EmailForm.tsx`

### d642a08 (2026-03-13) leads API: remove name from Supabase insert (column not in schema)
- **M** `app/api/leads/route.ts`

### 6a84fbf (2026-03-13) leads API: log full Supabase error (code, message, details, hint) for debugging
- **M** `app/api/leads/route.ts`

### f217a65 (2026-03-13) EmailForm: success message, error feedback, leads API Supabase env validation
- **M** `app/api/leads/route.ts`
- **M** `components/ui/EmailForm.tsx`

### 11adb41 (2026-03-13) HighLevel webhook, EmailForm submit fix (phone optional), HIGLEVEL_SETUP.md
- **A** `HIGLEVEL_SETUP.md`
- **M** `app/api/leads/route.ts`
- **M** `components/ui/EmailForm.tsx`

### 6f0d401 (2026-03-12) Progress bar countdown, scroll perf (debounce video, RAF), Meta Pixel fallback ID
- **M** `components/layout/TrackingScripts.tsx`
- **M** `components/sections/SocialProofSection.tsx`
- **M** `components/sections/VideoShowcaseSection.tsx`
- **M** `components/ui/MobileCTABar.tsx`
- **M** `components/ui/ScrollProgress.tsx`

### c7c138c (2026-03-12) Mobile CTA: remove 'Ograničen broj mesta' text
- **M** `components/ui/MobileCTABar.tsx`

### b4fdad4 (2026-03-12) Video showcase: full bleed PC, unlimited mobile scroll, lazy load, logo fallback - CHANGELOG updated
- **M** `CHANGELOG_PRE_LIVE.md`
- **M** `components/sections/VideoShowcaseSection.tsx`

### 6f7f2f4 (2026-03-12) Live update: integrations, Meta Pixel, Join, touch swipe, platform optimizations
- **M** `.gitignore`
- **A** `CHANGELOG_PRE_LIVE.md`
- **D** `DEPLOY.md`
- **M** `SUPABASE_SCHEMA.txt`
- **M** `UPUTSTVO.md`
- **M** `UPUTSTVO.txt`
- **M** `app/api/ai/generate/route.ts`
- **M** `app/api/chat/route.ts`
- **M** `app/api/leads/route.ts`
- **M** `app/globals.css`
- **M** `app/join/page.tsx`
- **M** `app/layout.tsx`
- **M** `app/page.tsx`
- **M** `components/layout/TrackingScripts.tsx`
- **M** `components/sections/FAQSection.tsx`
- **M** `components/sections/HeroSection.tsx`
- **M** `components/sections/HowToEnterSection.tsx`
- **M** `components/sections/ProblemSection.tsx`
- **M** `components/sections/SocialProofSection.tsx`
- **M** `components/sections/VideoShowcaseSection.tsx`
- **A** `public/explainer-vsl.mp4`
- **A** `public/hero-srbija.mp4`
- **A** `public/hero-vsl.mp4`
- **A** `supabase-leads-name-migration.sql`

### 549640a (2026-03-11) Hero: hero-trailer.mp4 (1:19), redosled: Blog pa VideoShowcase
- **M** `app/layout.tsx`
- **M** `app/page.tsx`
- **M** `components/sections/HeroSection.tsx`
- **A** `public/hero-trailer.mp4`

### 6cc59da (2026-03-11) VideoShowcase: logo fallback, ivice prazne, kontinuirana rotacija
- **M** `CHANGELOG.md`
- **M** `components/sections/VideoShowcaseSection.tsx`

### eee54e1 (2026-03-11) Update: Hero video, countdown, Problem sekcija, Trile slike - vidi CHANGELOG.md
- **M** `.gitignore`
- **M** `CHANGELOG.md`
- **A** `DEPLOY.md`
- **M** `app/layout.tsx`
- **M** `components/sections/BlogSection.tsx`
- **M** `components/sections/HeroSection.tsx`
- **M** `components/sections/ProblemSection.tsx`
- **A** `public/blog-trile-1.png`
- **M** `public/blog-trile-2.png`
- **M** `public/blog-trile-3.png`
- **M** `public/blog-trile-4.png`
- **M** `public/blog-trile-5.png`
- **A** `public/blog-trile-6.png`
- **A** `public/blog-trile-7.png`
- **A** `public/blog-trile-8.png`

### 53307e9 (2026-03-11) Update: Header nav (O nama), Footer (TikTok, remove Twitter/LinkedIn/Cene), Blog section title, Trile/Rok Instagram links
- **A** `CHANGELOG.md`
- **M** `components/layout/Footer.tsx`
- **M** `components/layout/Header.tsx`
- **M** `components/sections/BlogSection.tsx`

### 1e7e573 (2026-03-11) Update: BlogSection (Trile CEO, Rok PM, Milivojka vest, slideshow), Meta Pixel Lead, deploy docs, plexus bg, video examples
- **M** `.gitignore`
- **A** `BLOG_SECTION_SPEC.md`
- **A** `PREGLED_TOKENA_I_TAGOVA.md`
- **A** `PRE_DEPLOY_CHECKLIST.md`
- **M** `UPUTSTVO.md`
- **A** `UPUTSTVO_DEPLOY.md`
- **A** `UPUTSTVO_DEPLOY.txt`
- **A** `app/api/geo/route.ts`
- **M** `app/api/leads/route.ts`
- **M** `app/globals.css`
- **M** `app/join/page.tsx`
- **M** `app/page.tsx`
- **M** `components/sections/BlogSection.tsx`
- **M** `components/sections/HeroSection.tsx`
- **M** `components/sections/VideoShowcaseSection.tsx`
- **M** `components/ui/EmailForm.tsx`
- **M** `components/ui/UrgencyNotification.tsx`
- **A** `components/ui/spotlight-cursor.tsx`
- **A** `public/blog-rok-kadoic.png`
- **A** `public/blog-trile-2.png`
- **A** `public/blog-trile-3.png`
- **A** `public/blog-trile-4.png`
- **A** `public/blog-trile-5.png`
- **A** `public/examples/v12.mp4`
- **A** `public/examples/v13.mp4`
- **A** `public/examples/v14.mp4`
- **A** `public/examples/v16.mp4`
- **A** `public/examples/v17.mp4`
- **A** `public/pozadina-plexus-2.png`
- **A** `public/pozadina-plexus-3.png`
- **A** `public/pozadina-plexus-sections.png`
- **A** `public/pozadina-plexus.png`

### 00f4ff6 (2026-03-11) Design: Meta Pixel, og:image, affiliate links typo
- **M** `app/affiliate/dashboard/links/page.tsx`
- **M** `app/layout.tsx`
- **A** `components/layout/TrackingScripts.tsx`

