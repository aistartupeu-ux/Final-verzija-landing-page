# Pregled API tokena, tagova i Vercel/Supabase povezanosti

## 1. API tokeni (Environment Variables)

| Token | Status | Svrha |
|-------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Koristi se | Supabase projekat — leads, affiliates, konverzije |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Koristi se | Javni ključ za klijentski Supabase (lib/supabase.ts) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Koristi se | Server-side — leads API, affiliate, conversion, ref/[code] |
| `RESEND_API_KEY` | ✅ Opciono | Email obaveštenja nakon prijave na leads |
| `POYO_API_KEY` | ✅ Obavezno | AI generisanje slika/videa/muzike |
| `IPAPI_API_KEY` | ✅ **NOVO** | Geo lokacija (leads + UrgencyNotification). Pre: hardkodovan u kodu — sada iz env. **Dodaj u Vercel.** Besplatno: https://ipapi.co/signup/ (30k req/dan) |

---

## 2. Tracking tagovi za kampanje

**Dodato:** `TrackingScripts` komponenta uključuje skripte kada su env var postavljene.

| Tag | Env varijabla | Svrha |
|-----|---------------|-------|
| Google Analytics 4 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` (npr. G-XXXXXXXXXX) | Praćenje poseta, konverzija |
| Meta (Facebook) Pixel | `NEXT_PUBLIC_META_PIXEL_ID` | Meta oglasi, retargeting |
| Google Tag Manager | `NEXT_PUBLIC_GTM_ID` (GTM-XXXXXXX) | Centralno upravljanje tagovima |

**Kako aktivirati:** Dodaj vrednosti u Vercel → Settings → Environment Variables → redeploy.

---

## 3. Sakupljanje podataka

| Izvor | Gde se čuva | Geo |
|-------|-------------|-----|
| **EmailForm** (hero, CTA) | `leads` tabela u Supabase | Da (ipapi, preko IP) |
| **Join stranica** | `leads` tabela + localStorage | Da |
| **Affiliate klikovi** | `affiliate_clicks` u Supabase | Ne (samo IP, UA, referrer) |

**Ispravke:**
- EmailForm sada proverava `res.ok` pre prikaza uspeha — ako API ne uspe, korisnik ne vidi lažnu potvrdu.
- Join stranica sada šalje email u `/api/leads` za kampanju (pre: samo localStorage).
- Join stranica postavlja `af_ref` cookie kada korisnik dođe preko `/join?ref=CODE` (affiliate direktni link).

---

## 4. Vercel povezanost

- **Build:** Next.js se automatski detektuje.
- **Env varijable:** Ručno u Vercel → Settings → Environment Variables. Koristi `.env.example` kao referencu.
- **Domen:** aihype-academy.com (podešen prema UPUTSTVO.md).
- **Og:image:** Apsolutni URL `https://aihype-academy.com/og-image.png` radi ispravnog deljenja na društvenim mrežama.

---

## 5. Supabase povezanost

- **Layout:** `dns-prefetch` i `preconnect` ka Supabase kada je `NEXT_PUBLIC_SUPABASE_URL` setovan.
- **RLS:** Isključen na svim tabelama (leads, affiliates, affiliate_clicks, affiliate_conversions, affiliate_payouts) — obavezno pokrenuti SQL iz SUPABASE_SCHEMA.
- **Tabele:** leads, affiliates, affiliate_clicks, affiliate_conversions, affiliate_payouts.

---

## 6. Važne napomene

1. **IPAPI ključ:** Stari hardkodovani ključ je uklonjen. Postavi `IPAPI_API_KEY` u Vercel ili koristi besplatni limit (1000 req/dan bez ključa).
2. **Affiliate link:** Typo ispravljen — `ayhypeacademy.com` → `aihype-academy.com` u links page.
3. **Direktni link na prijavu:** `/join?ref=CODE` sada postavlja `af_ref` cookie, tako da konverzije budu pravilno pripisane affiliate-u.
