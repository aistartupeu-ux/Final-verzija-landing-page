# Localhost setup — testiraj pre live-a

## 1. Env varijable

1. Kopiraj `.env.example` u `.env.local`
2. Popuni obavezne vrednosti:
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase projekat URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — Service role key
   - `ADMIN_ANALYTICS_SECRET` — kod za pristup admin analytics (izaberi sam)

## 2. Supabase migracija

Pokreni migraciju za UTM kolone (ako već nisi):

```bash
# U Supabase SQL Editor:
# Sadržaj fajla supabase-leads-utm-migration.sql
```

## 3. Pokretanje

```bash
npm install
npm run dev
```

Otvori `http://localhost:3000`

## 4. Šta radi na localhost

| Funkcija | Radi bez dodatnog env |
|----------|------------------------|
| Forme, lead upis u Supabase | Da (Supabase URL + keys) |
| Admin analytics `/admin/x7k9m2q4` | Da (ADMIN_ANALYTICS_SECRET) |
| Real-time osvežavanje leadova | Da (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY) |
| Sheet obogaćivanje (tiktok, ig, fb) | Ne — treba LEADS_SHEET_ID + GOOGLE_SERVICE_ACCOUNT_JSON |
| Meta Ads CPL | Ne — treba META_ADS_ACCESS_TOKEN + META_AD_ACCOUNT_ID |

## 5. Praćenje (source_tag, UTM)

Pratimo:

- **source_tag** — izvodimo iz utm_source (instagram, facebook, tiktok, affiliate, direct)
- **utm_source** — npr. `instagram`, `facebook`, `tiktok`, `ig`, `fb`
- **utm_medium** — npr. `cpc`, `organic`
- **utm_campaign** — naziv kampanje

Meta kampanje razdvajamo:

- **Instagram** — link u oglasu mora imati `utm_source=instagram` (ili `ig`)
- **Facebook** — link mora imati `utm_source=facebook` (ili `fb`)

Meta Ads API povlači spend/leads posebno po platformi (`publisher_platform`).

## 6. Test na localhost

1. Otvori `http://localhost:3000/?utm_source=instagram&utm_campaign=test`
2. Popuni formu → lead u Supabase sa source_tag=instagram
3. Otvori `http://localhost:3000/admin/x7k9m2q4` → unesi ADMIN_ANALYTICS_SECRET
4. Proveri da se Instagram lead prikazuje

Ponovi sa `utm_source=facebook` i `utm_source=tiktok`.

## 7. Pre deploy-a na live

- [ ] Sve env u Vercel
- [ ] Redeploy nakon promene env
- [ ] Test lead na produkciji
- [ ] Proveri admin analytics na live domenu
