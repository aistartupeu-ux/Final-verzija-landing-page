# Pre-deploy checklist – AI Hype Academy

## ✅ Kod & build

- **Linter:** Nema grešaka
- **Build:** `npm run build` prolazi uspešno
- **TypeScript:** Kompajluje bez problema

---

## 🔗 Supabase

### Obavezne env varijable (Vercel / .env.local)

| Varijabla | Gde se koristi | Opis |
|-----------|----------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | layout, leads, affiliate, ref | URL Supabase projekta |
| `SUPABASE_SERVICE_ROLE_KEY` | leads, affiliate, ref, conversion | Server-side ključ (admin pristup) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | lib/supabase (opciono) | Anon key za client-side (trenutno nije korišćen) |

### Supabase tabele (iz SUPABASE_SCHEMA.txt)

- `leads` – email prijave
- `affiliates` – affiliate partneri
- `affiliate_clicks` – kliki na referalne linkove
- `affiliate_conversions` – prodaje
- `affiliate_payouts` – isplate

### Provera

1. Migracija: pokreni SQL iz `SUPABASE_SCHEMA.txt` u Supabase SQL Editoru ako još nije.
2. RLS: proveri da RLS pravila dozvoljavaju ono što API route-ovi treba da rade.
3. Env: u Vercel-u dodaj `NEXT_PUBLIC_SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY`.

---

## 📊 Meta Pixel

### Status

- **Pixel ID:** `2347723352398323` (fallback ako nema env)
- **Env varijabla:** `NEXT_PUBLIC_META_PIXEL_ID` (opciono – koristi se fallback)
- **TrackingScripts:** učitava fbq, PageView na svakoj stranici
- **Lead event:** šalje se pri uspešnoj prijavi u EmailForm

### Provera

1. Vercel: `NEXT_PUBLIC_META_PIXEL_ID` može da ostane prazan (koristi se fallback).
2. Meta Events Manager: proveri da li se PageView i Lead događaji prijavljuju.

---

## 📧 Ostale integracije

### Resend (email)

| Varijabla | Opis |
|-----------|------|
| `RESEND_API_KEY` | API ključ za Resend |

- Koristi se u `/api/leads` za dobrodošlicu nakon prijave
- Ako nema ključa, lead se i dalje upisuje u Supabase, samo se ne šalje email

### ipapi.co (geolokacija)

| Varijabla | Opis |
|-----------|------|
| `IPAPI_API_KEY` | Opciono – za veći rate limit |

- Bez ključa ipapi.co radi sa ograničenim brojem poziva

### AI API (Poyo, OpenAI)

| Varijabla | Gde | Opis |
|-----------|-----|------|
| `POYO_API_KEY` | /api/ai/generate, /api/ai/music, /api/ai/status | Poyo AI za slike/video/muziku |
| `OPENAI_API_KEY` | /api/chat | OpenAI za chat |

- Dashboard Studio zavisi od ovih ključeva.

---

## 🔧 Funkcionalnosti

| Funkcija | Status | Napomena |
|----------|--------|----------|
| Hero email forma | ✅ | Šalje na /api/leads |
| Meta Pixel PageView | ✅ | Na svim stranicama |
| Meta Pixel Lead | ✅ | Pri uspešnoj prijavi |
| Supabase leads | ✅ | Zahteva URL + SERVICE_ROLE_KEY |
| Affiliate /ref/[code] | ✅ | Redirect + cookie + click tracking |
| Affiliate conversion | ✅ | POST /api/affiliate/conversion |
| Affiliate login/register | ✅ | Zahteva Supabase |
| Blog section | ✅ | Trile, Rok, Milivojka |
| Dashboard Studio | ✅ | Zavisi od POYO/OPENAI ključeva |

---

## 🚀 Pre deploy koraci

1. **Vercel env varijable** – postavi obavezne:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Opciono (za punu funkcionalnost):**
   - `RESEND_API_KEY` – dobrodošli email
   - `NEXT_PUBLIC_META_PIXEL_ID` – ako želiš drugi pixel
   - `POYO_API_KEY`, `OPENAI_API_KEY` – za Studio
   - `IPAPI_API_KEY` – za bolji geo

3. **Supabase migracija** – pokreni `SUPABASE_SCHEMA.txt` ako još nije.

4. **Test nakon deploy-a:**
   - Prijava leada preko Hero forme
   - Provera da lead stiže u Supabase
   - Provera Meta Pixel događaja u Events Manageru
   - Klik na /ref/TEST i provera affiliate_clicks
