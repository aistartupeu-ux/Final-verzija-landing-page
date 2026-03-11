# AI Hype Academy — Promene pre lansiranja (Live)

> Svi fajlovi i integracije ažurirani pre prelaska u produkciju.

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

### Chat API (`/api/chat`)
- Prijateljska poruka ako `OPENAI_API_KEY` nije postavljen

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

## 3. Video showcase (mobilni)

- Touch swipe: korisnici mogu vući video kartice prstom levo/desno
- Marquee loop ostaje aktivan tokom swipe-a
- Responsivne kartice: 170×302px (≤640px), 185×329px (641–768px), 200×356px (desktop)
- `touch-action: pan-y` — vertikalni scroll stranice neometan

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
| `app/api/chat/route.ts` | Check za OPENAI_API_KEY |
| `app/api/ai/generate/route.ts` | Check za POYO_API_KEY |
| `components/layout/TrackingScripts.tsx` | Meta Pixel samo iz env |
| `components/sections/VideoShowcaseSection.tsx` | Touch swipe, responsivne kartice |
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
- [ ] `OPENAI_API_KEY` postavljen (chat)
- [ ] `POYO_API_KEY` postavljen (AI Studio)
- [ ] `vercel --prod` za deploy
