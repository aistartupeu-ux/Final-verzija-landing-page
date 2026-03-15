# AI Hype Academy — Promene (Changelog)

> Svi fajlovi i integracije ažurirani.

---

## Poslednje izmene (Live Update)

### Video showcase sekcija
- **Lazy load:** Video se učitava tek kada je kartica u blizini viewport-a (rootMargin 200px)
- **Logo umesto crnog ekrana:** Dok se video učitava ili ako ne uspe — logo sa gradijentnom pozadinom
- **PC full bleed:** Redovi se protežu do ivica ekrana (100vw, calc(50% - 50vw)) na rezolucijama ≥769px
- **Mobilni touch scroll:** Samo telefoni (≤768px) — neograničen slide levo/desno, loop i animacije ostaju
- **Optimizacija:** React.memo na VideoCard, contain: layout paint, loading="lazy" za logo

---

## 1. Integracije

### Welcome email (Resend)
- Personalizovan subject: `Dobrodošao, [ime]!`
- Personalizovan pozdrav u emailu: `Pozdrav, [ime]!`
- API prima i šalje `name` u Supabase

### Meta Pixel
- Nema hardcoded fallback — učitava se samo kada je `NEXT_PUBLIC_META_PIXEL_ID` postavljen u env
- Na Join stranici: `fbq("track", "Lead")` nakon uspešne prijave

### Join stranica (`/join`)
- Šalje `name` u `/api/leads`
- Provera `res.ok` — prikazuje grešku ako API ne uspe
- Meta Pixel Lead tracking nakon uspešnog submit-a

### AI Studio API (`/api/ai/generate`)
- Prijateljska poruka ako `POYO_API_KEY` nije postavljen

---

## 2. Baza podataka

### Leads tabela
- Nova kolona: `name` (text, opciono)
- Migracija: `supabase-leads-name-migration.sql`

**Pre deploya:** Pokreni u Supabase SQL Editoru:
```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name text;
```

---

## 3. Video showcase

### Mobilni (≤768px)
- Touch swipe: neograničen slide levo/desno
- Marquee loop ostaje aktivan tokom swipe-a
- Responsivne kartice: 170×302px (≤640px), 185×329px (641–768px), 200×356px (desktop)
- `touch-action: pan-y` — vertikalni scroll stranice neometan

### PC (≥769px)
- Full bleed do ivica ekrana (zavisi od rezolucije)
- Uži mask fade (2%) za više sadržaja do rubova

### Optimizacija
- Lazy load videa (IntersectionObserver)
- Logo fallback dok se učitava / pri grešci
- React.memo, contain, loading lazy

---

## 4. Platforme (optimizacija)

- Viewport: `viewport-fit=cover` za uređaje sa notch-om
- Body: `padding: env(safe-area-inset-*)` za iOS
- `maximum-scale=5` za pristupačnost

---

## 5. Izmenjeni fajlovi

| Fajl | Promene |
|------|---------|
| `app/join/page.tsx` | API error handling, Meta Lead, šalje name |
| `app/api/leads/route.ts` | Prima name, personalizovan email |
| `app/api/ai/generate/route.ts` | Check za POYO_API_KEY |
| `components/layout/TrackingScripts.tsx` | Meta Pixel samo iz env |
| `components/sections/VideoShowcaseSection.tsx` | Touch swipe (mobil), full bleed (PC), lazy load, logo fallback, optimizacija |
| `app/layout.tsx` | viewport-fit=cover |
| `app/globals.css` | safe-area padding |
| `SUPABASE_SCHEMA.txt` | Kolona name u leads |
| `supabase-leads-name-migration.sql` | Nova migracija |
| `UPUTSTVO.md` | Ažurirana dokumentacija |
| `UPUTSTVO.txt` | Ažurirana dokumentacija |

---

## 6. Checklist pre deploya

- [ ] Pokrenuta Supabase migracija za `name` kolonu
- [ ] `NEXT_PUBLIC_META_PIXEL_ID` postavljen u Vercel
- [ ] `RESEND_API_KEY` postavljen (welcome email)
- [ ] `POYO_API_KEY` postavljen (AI Studio)
- [ ] `vercel --prod` za deploy
