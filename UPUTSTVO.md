# AI Hype Academy — Kompletno Uputstvo za Klijenta

> Ovaj dokument objašnjava sve što treba da znaš o upravljanju sajtom, leadovima, affiliate sistemom i deploymentom.

---

## Sadržaj

1. [Pregled sajta](#1-pregled-sajta)
2. [Struktura stranica](#2-struktura-stranica)
3. [Kako upravljati leadovima](#3-kako-upravljati-leadovima)
4. [Email sistem (Resend)](#4-email-sistem-resend)
5. [Affiliate sistem](#5-affiliate-sistem)
6. [Supabase baza podataka](#6-supabase-baza-podataka)
7. [Kako promeniti sadržaj na sajtu](#7-kako-promeniti-sadrzaj-na-sajtu)
8. [Deployment na Vercel](#8-deployment-na-vercel)
9. [Domen (aihype-academy.com)](#9-domen-aihype-academycom)
10. [Integracije (prelazak u live)](#10-integracije-prelazak-u-live)
11. [Česta pitanja i problemi](#11-cesta-pitanja-i-problemi)

---

## 1. Pregled sajta

**Sajt:** https://www.aihype-academy.com

Sajt je izgrađen u **Next.js 16** i hostovan na **Vercel** platformi. Koristiš **Supabase** kao bazu podataka i **Resend** za slanje emailova.

### Šta sajt radi:
- Hvata emailove i telefone zainteresovanih (waiting lista)
- Automatski šalje welcome email svakom ko ostavi kontakt
- Prikazuje countdown timer, video, module kursa
- Ima affiliate sistem za partnere koji promovisuju kurs

---

## 2. Struktura stranica

### Glavna stranica (`/`)
Redosled sekcija od vrha do dna:

| Sekcija | Opis |
|---|---|
| **Hero** | Glavni naslov, explainer video, email forma, countdown |
| **Problem** | Zašto je AI znanje bitno |
| **Solution** | Kako AI Hype Academy rešava problem |
| **Video Showcase** | Ticker traka sa primerima videa iz kursa |
| **Brojevi** | Ticker statistike + broj osoba na waiting listi (čuva se lokalno) |
| **Šta ćeš naučiti** | 8 outcome kartica (veštine koje student stiče) |
| **Kako ući** | 4 koraka prijave |
| **FAQ** | Najčešća pitanja |
| **Final CTA** | Poslednji poziv na akciju sa email formom |
| **Blog** | Članci i vesti |
| **Affiliate** | "Zaradite s nama" sekcija (trenutno greyed out) |

### Ostale stranice:

| URL | Opis |
|---|---|
| `/join` | Stranica za kreiranje naloga |
| `/dashboard` | Dashboard za studente (AI alati) |
| `/affiliate` | Affiliate info stranica |
| `/affiliate/register` | Registracija affiliate partnera |
| `/affiliate/login` | Prijava affiliate partnera |
| `/affiliate/dashboard` | Affiliate panel (statistike, link, zarade) |

---

## 3. Kako upravljati leadovima

Svaki put kada neko ostavi email na sajtu, podaci se čuvaju u **Supabase** tabeli `leads`.

### Kako videti leadove:

1. Idi na https://supabase.com/dashboard
2. Otvori projekat `loefllnazisbqibgidbq`
3. Klikni **Table Editor** u levom meniju
4. Klikni na tabelu **leads**

Tabela sadrži:
- `email` — email adresa
- `name` — ime (sa Join stranice, opciono)
- `phone` — broj telefona (opciono)
- `city`, `country` — lokacija (automatski detektovana)
- `created_at` — kada se prijavil/la

**Napomena:** Ako tabela `leads` nema kolonu `name`, pokreni migraciju iz fajla `supabase-leads-name-migration.sql` u Supabase SQL Editoru.

### Export leadova u Excel/CSV:
U Supabase Table Editor, klikni dugme **Export** u gornjem desnom uglu.

---

## 4. Email sistem (Resend)

Svaki lead automatski dobija welcome email sa:
- Logom AI Hype Academy
- Personalizovanom porukom dobrodošlice („Pozdrav, [ime]!“ ako je ime upisano)
- Listom benefita kursa
- Linkom nazad na sajt

**Resend dashboard:** https://resend.com/dashboard

Ovde možeš videti:
- Sve poslate emailove
- Statistike isporuke (delivery rate)
- Bounce/spam prijave

**Email se šalje sa:** `noreply@aihype-academy.com`

### Ako email ne stiže:
1. Proveri Resend dashboard da li ima grešaka
2. Proveri da li je `RESEND_API_KEY` setovan u Vercel environment variables
3. Proveri spam folder primaoca

---

## 5. Affiliate sistem

Affiliate sistem omogućava partnerima da promovisuju kurs i zarađuju 30% provizije.

### Trenutni status: USKORO (greyed out na sajtu)

Da aktiviraš affiliate sistem:
1. Otvori `components/sections/AffiliateSection.tsx`
2. Zameni sadržaj sa aktivnom verzijom (kontaktiraj developera)

### Kako affiliate sistem funkcioniše:

**Tok:**
```
Partner dobija link → npr. aihype-academy.com/ref/MARKO123
→ Posetilac klikne link
→ Sistem beleži klik u bazu
→ Kolačić se čuva 30 dana
→ Ako posetilac kupi kurs → sistem automatski pripisuje 30% proviziju partneru
```

### Affiliate panel (za partnere):

| URL | Opis |
|---|---|
| `/affiliate` | Info o programu |
| `/affiliate/register` | Registracija (besplatno) |
| `/affiliate/login` | Prijava |
| `/affiliate/dashboard` | Pregled klikova, konverzija i zarada |
| `/affiliate/dashboard/links` | Referalni linkovi + promo tekstovi |
| `/affiliate/dashboard/earnings` | Detaljne zarade |
| `/affiliate/dashboard/payouts` | Zahtevi za isplatu |

### Supabase tabele za affiliate:
- `affiliates` — affiliate nalozi
- `affiliate_clicks` — svaki klik na referalni link
- `affiliate_conversions` — prodaje pripisane affiliateu
- `affiliate_payouts` — isplate

### Kako odobriti isplatu:
1. Idi u Supabase → Table Editor → `affiliate_payouts`
2. Pronađi zahtev sa statusom `pending`
3. Promeni status na `paid`
4. Izvrši uplatu partneru na njegov payout email

### Kako beležiti prodaju (konverziju):
Kada neko kupi kurs, pozovi ovaj endpoint:
```
POST https://www.aihype-academy.com/api/affiliate/conversion
Content-Type: application/json

{
  "orderAmount": 9900
}
```
Sistem automatski čita kolačić `af_ref` i pripisuje proviziju odgovarajućem affiliateu.

---

## 6. Supabase baza podataka

**URL:** https://supabase.com/dashboard/project/loefllnazisbqibgidbq

### Tabele:

| Tabela | Opis |
|---|---|
| `leads` | Svi leadovi sa sajta (email, telefon, lokacija) |
| `affiliates` | Affiliate partneri |
| `affiliate_clicks` | Klikovi na referalne linkove |
| `affiliate_conversions` | Prodaje |
| `affiliate_payouts` | Isplate |

### Kredencijali (čuvaj u tajnosti!):
Nalaze se u fajlu `.env.local` u projektu i u Vercel environment variables.

---

## 7. Kako promeniti sadržaj na sajtu

Svaka sekcija je poseban fajl u folderu `components/sections/`.

### Promena teksta u sekcijama:

| Sekcija | Fajl |
|---|---|
| Hero naslov/subtitle | `components/sections/HeroSection.tsx` |
| Problem sekcija | `components/sections/ProblemSection.tsx` |
| Solution sekcija | `components/sections/SolutionSection.tsx` |
| Video showcase | `components/sections/VideoShowcaseSection.tsx` |
| Statistike/waitlist | `components/sections/SocialProofSection.tsx` |
| Šta ćeš naučiti | `components/sections/ForWhoSection.tsx` |
| Kako ući (koraci) | `components/sections/HowToEnterSection.tsx` |
| FAQ pitanja | `components/sections/FAQSection.tsx` |
| Blog članci | `components/sections/BlogSection.tsx` |

### Promena videa na sajtu:
- **Hero background video:** zameni fajl `public/hero-vsl.mp4`
- **Explainer video:** zameni fajl `public/explainer-video.mp4`
- **Showcase videi:** zameni fajlove `public/examples/v1.mp4` do `v10.mp4`

### Promena loga:
Zameni fajl `public/logo.png` (preporučena veličina: 260x80px)

### Promena OG slike (za deljenje na mrežama):
Zameni fajl `public/og-image.png` (preporučena veličina: 1200x630px)

### Promena countdown timera:
Otvori `components/sections/HeroSection.tsx` i pronađi liniju:
```javascript
const TARGET_DATE = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
```
Broj `21` = broj dana od trenutnog momenta. Možeš ga promeniti ili staviti konkretni datum.

### Promena FAQ pitanja:
Otvori `components/sections/FAQSection.tsx` i uredi niz `faqs` na vrhu fajla.

---

## 8. Deployment na Vercel

Svaka promena koda mora biti deployovana da bi se videla na sajtu.

### Kako deployovati:

1. Otvori terminal u folderu projekta
2. Pokreni:
```bash
vercel --prod
```
3. Sačekaj 30-40 sekundi
4. Sajt je automatski ažuriran na https://www.aihype-academy.com

### Vercel dashboard:
https://vercel.com/narfkos-projects/ayhype-academy

Ovde možeš videti:
- Sve prethodne deploymente
- Logove grešaka
- Environment varijable
- Analitiku poseta

### Environment varijable (API ključevi):
Nalaze se u Vercel → Settings → Environment Variables:

| Varijabla | Opis |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase projekta |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Javni Supabase ključ |
| `SUPABASE_SERVICE_ROLE_KEY` | Privatni Supabase ključ (ne deliti!) |
| `RESEND_API_KEY` | Resend API ključ za emailove |
| `OPENAI_API_KEY` | OpenAI ključ za chat asistenta |
| `POYO_API_KEY` | PoYo AI ključ za generisanje medija |
| `IPAPI_API_KEY` | ipapi.co ključ za geo (leads + UrgencyNotification) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID (G-XXXXXXXXXX) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta/Facebook Pixel ID (obavezno za Lead tracking na Join stranici) |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager ID (GTM-XXXXXXX) |

---

## 9. Domen (aihype-academy.com)

**Domen registrovan na:** Namecheap (nalog: proveri kod vlasnika)

**DNS podešavanja na Namecheap:**

| Tip | Host | Vrednost |
|---|---|---|
| A Record | @ | 216.150.1.1 |
| CNAME | www | 332331ef76241b11.vercel-dns-016.com. |
| TXT | resend._domainkey | (DKIM za email) |
| TXT | send | v=spf1 include:amazonses.com ~all |
| TXT | _dmarc | v=DMARC1; p=none; |

### Ako sajt ne radi:
1. Proveri da li su DNS zapisi ispravni na Namecheap
2. Idi na Vercel → projekt → Settings → Domains i proveri status
3. DNS propagacija može trajati do 24h nakon promena

---

## 10. Integracije (prelazak u live)

### Šta je uključeno u produkciju
- **Welcome email (Resend):** Personalizovan subject i pozdrav sa imenom
- **Meta Pixel:** Učitava se samo kada je `NEXT_PUBLIC_META_PIXEL_ID` postavljen; na Join stranici šalje Lead event nakon uspešne prijave
- **Join stranica:** Šalje `name` u API, proverava odgovor i prikazuje grešku ako prijava ne uspe
- **Chat:** Prijateljska poruka ako `OPENAI_API_KEY` nije postavljen
- **AI Studio:** Prijateljska poruka ako `POYO_API_KEY` nije postavljen
- **Video showcase:** Touch swipe na mobilnim uređajima, responsivne kartice
- **Platforme:** Viewport-fit za notch uređaje, safe-area padding za iOS

### Pre deploya — pokreni Supabase migraciju
Ako tabela `leads` još nema kolonu `name`, pokreni u Supabase SQL Editoru:
```sql
-- fajl: supabase-leads-name-migration.sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name text;
```

---

## 11. Česta pitanja i problemi

### "Greška pri registraciji" na affiliate stranici
**Uzrok:** Supabase RLS (Row Level Security) je uključen na tabelama.
**Rešenje:** Pokretaj SQL u Supabase SQL Editoru:
```sql
alter table affiliates disable row level security;
alter table affiliate_clicks disable row level security;
alter table affiliate_conversions disable row level security;
alter table affiliate_payouts disable row level security;
```

### Email ne stiže korisnicima
1. Proveri Resend dashboard → Logs
2. Proveri da li je domen verifikovan u Resend
3. Proveri da li je `RESEND_API_KEY` aktivan u Vercel env variables

### Sajt ne radi / DNS greška u Chrome
Chrome keširа DNS agresivno. Reši:
1. Otvori `chrome://net-internals/#dns`
2. Klikni "Clear host cache"

### Kako dodati nove video primere
1. Kopiraj video fajl u `public/examples/` kao `v11.mp4`, `v12.mp4` itd.
2. Otvori `components/sections/VideoShowcaseSection.tsx`
3. Dodaj novi video u niz `row1` ili `row2`
4. Deployuj: `vercel --prod`

**Video showcase na mobilnom:** Na touch uređajima korisnici mogu vući video kartice prstom levo/desno dok marquee loop ostaje aktivan.

### Kako promeniti cenu kursa
Kurs još uvek nema prodajnu stranicu. Kada se lansira, kontaktiraju developera da integriše payment procesor (Stripe ili lokalni).

### Waitlist brojač raste previše brzo / sporo
Otvori `components/sections/SocialProofSection.tsx` i pronađi:
```javascript
const SIGNUPS_PER_HOUR = 2.5;  // broj "prijava" po satu (simulirano)
```
Promeni broj po potrebi. `MAX_COUNT = 749` je maksimum koji se prikazuje.

---

## Kontakt za tehničku podršku

Za sve izmene, greške ili nova podešavanja — kontaktiraj developera.

**Projekat:** AI Hype Academy  
**Sajt:** https://www.aihype-academy.com  
**Vercel:** https://vercel.com/narfkos-projects/ayhype-academy  
**Supabase:** https://supabase.com/dashboard/project/loefllnazisbqibgidbq  
**Resend:** https://resend.com/dashboard
