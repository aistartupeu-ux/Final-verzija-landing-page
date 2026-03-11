# Changelog – AI Hype Academy

## [Unreleased] – 2026-03-11

### Hero sekcija
- Hero video zamenjen sa **SRBIJA TRAILER.mp4** (1:19) – fajl `hero-srbija.mp4`
- Dodat cache-buster `?v=2` na video URL radi osvežavanja u pregledaču

### Countdown timer
- Fiksirano ciljno vreme: **31. mart 2026. 23:59:59** (poslednji dan prijava)
- Ranije: računao 21 dana od učitavanja stranice

### Problem sekcija
- **Naslov (h2):** "Tržište je u fazi buke." → "Svi pričaju o **AI-ju.** Malo ko zna kako da ga pretvori u novac." (AI-ju istaknuto plavom bojom)
- **Paragraf:** Zamenjen sa "Internet je prepun tutorijala, alata i kurseva. Ali bez sistema sve to ostaje samo još jedna informacija."
- **Font:** h2 smanjen na `clamp(26px, 4vw, 42px)`, bold tekst sa 18px na 16px
- **Chart (Rast Znanja):** Uklonjen podnaslov, naslov "Rast Znanja" → "Nedeljni napredak kroz AI sistem"

### Blog sekcija – Trile kartica
- Zamenjene hero slike sa 8 novih fotografija (`blog-trile-1.png` – `blog-trile-8.png`)
- Slide animacija prolazi kroz svih 8 slika

### Tehnički napomene
- `hero-srbija.mp4` (~188MB) dodat u `.gitignore` zbog GitHub limit 100MB – za produkciju ručno uploadovati u `public/`

---

## [Prethodno] – 2026-03

### Header
- Uklonjeni linkovi "Program" i "Rezultati"
- Dodat link "O nama" (vodi ka #blog – Blog sekciji)
- Zadržan "Kako funkcioniše"

### Footer
- Uklonjena stavka "Cene" iz Platforma liste
- Instagram ikonica → link na https://www.instagram.com/aihype.official
- Dodata TikTok ikonica → link na https://www.tiktok.com/@ai.hype.akademija
- Uklonjene ikonice Twitter i LinkedIn
- "O nama" u footeru vodi ka #blog

### Blog sekcija
- Naslov sekcije: "Blog & Vesti" → "Ko stoji iza AI Hype Akademije"
- **Trile** – naslov/podnaslov: "Trile" + "Muzičar, osnivač AI Hype Akademije"; ime Trile klikabilno → Instagram @trileofficial
- **Rok Kadoič** – naslov/podnaslov: "Rok Kadoič" + "Reditelj, kreativni producent AI Hype Akademije"; ime Rok Kadoič klikabilno → Instagram @rok_kadoic
