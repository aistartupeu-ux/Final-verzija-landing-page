# Admin Analytics — privatna stranica za izvore i CPL

## Šta je

Stranica `/admin/x7k9m2q4` prikazuje:
- **Odakle dolaze leadovi** — Instagram, Facebook, TikTok, direktno (zasebno po platformi)
- **Ukupan broj leadova** po periodu
- **Cost per Lead (CPL)** za Meta i TikTok — unosiš potrošnju (€) i automatski se računa CPL
- **Meta CPL po kampanji** — tabela: za svaku aktivnu kampanju posebno IG/FB potrošnja, leadovi iz Meta insights-a i CPL (plus „blend“ preko obe mreže)

## Pristup

Stranica je **zaštićena**. HttpOnly sesija sa HMAC potpisom — kod se nikad ne čuva u browseru.

### Setup

1. U Vercel → Settings → Environment Variables dodaj:
   ```
   ADMIN_ANALYTICS_SECRET=tvoj_tajni_kod_ovde
   ```
2. Redeploy.
3. Otvori `https://tvoj-domen.com/admin/login`
4. Unesi pristupni kod (ista vrednost kao `ADMIN_ANALYTICS_SECRET`)
5. Nakon uspešne prijave, sesija traje 24h (HttpOnly cookie, teško za krađu/XSS)
6. Direktan pristup na `/admin/x7k9m2q4` bez sesije preusmerava na `/admin/login`

### Meta Ads (Instagram, Facebook) — automatski CPL

Za automatsko povlačenje potrošnje i CPL iz Meta Ads:

1. Kreiraj Meta App: [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App → Business
2. Dodaj Marketing API
3. Generiši Access Token sa `ads_read` dozvolom
4. U Vercel dodaj:
   ```
   META_ADS_ACCESS_TOKEN=EAAxxxx...
   META_AD_ACCOUNT_ID=act_123456789
   META_LEAD_CAMPAIGN_NAME=MAD - AIH - Website Leads - 19.09.26
   ```
   - Ad Account ID iz Meta Business Suite → Settings → Ad Accounts
   - META_LEAD_CAMPAIGN_NAME (opciono): sužava **agregat** (kartice IG/FB) na jednu kampanju; **tabela po kampanjama** i dalje može prikazati više redova ako API vrati više kampanja u periodu — za striktno jednu kampanju postavi filter ili imaj jednu aktivnu lead kampanju

### TikTok Ads — automatski CPL (Marketing API)

1. U [TikTok Ads Manager](https://ads.tiktok.com/) → **Tools** → **Marketing API** (ili [TikTok for Business Developers](https://business-api.tiktok.com/portal/)) napravi aplikaciju i generiši **Access Token** sa dozvolama za čitanje izveštaja.
2. **Advertiser ID** (broj naloga) nađeš u Ads Manageru ili u portalu pod nalogom.
3. U Vercel dodaj:
   ```
   TIKTOK_ADS_ACCESS_TOKEN=xxxx
   TIKTOK_ADVERTISER_ID=1234567890
   ```
4. Redeploy. Dashboard povlači **Report Integrated Get** (kampanja, AUCTION): potrošnja, leadovi pre svega **`sales_lead`** (TikTok lead metrika). Metrika **`conversion`** u TikTok izveštajima obično obuhvata *sve* optimizovane konverzije, ne samo lead forme — zato je **podrazumevano isključena** iz broja leadova. Ako želiš staro ponašanje (broj leadova = `conversion` kada nema `sales_lead`), postavi `TIKTOK_REPORT_CONVERSION_AS_LEAD=1` u env. Ako token nije podešen, TikTok CPL ostaje **ručni unos** kao ranije.

### Šta znače brojevi (Meta vs TikTok vs sajt)

| Izvor | Šta meri |
|-------|----------|
| **Leadovi sa sajta** (kartice po izvoru, npr. Instagram / Facebook / TikTok) | Broj zapisa u Sheet + Supabase klasifikovanih po UTM / `source_tag` — **nije** isto što Meta/TikTok Ads API. |
| **Meta — CPL po kampanji** | Lead akcije iz **Meta Insights** (`actions`), uz strože tipove (`lead`, `onsite_conversion.lead*`, `offsite_conversion.fb_pixel_lead*`, `leadgen*`, itd.) i **max po redu** da se smanji duplo brojanje kada API vrati više lead-related tipova. |
| **TikTok Ads (API)** | Prvenstveno **`sales_lead`**; bez env zastavice ne koristimo `conversion` kao zamenu za lead. |
| **Agregat `metaLeads` u analytics API** | Zbir leadova sa sajta za **instagram + facebook** (za poređenje sa ukupnim trendom), ne broj iz Meta Ads API-ja. |

Ove tri linije **nemoj** tretirati kao jedan isti broj — različiti su definicija i izvor.

**Razlika CPL kartice vs. tabela po kampanji**

| Deo ekrana | Leadovi u nazivniku |
|------------|---------------------|
| Kartice Instagram / Facebook | Leadovi **sa sajta** (Sheet/Supabase) za ceo period — podela samo po `instagram` / `facebook` |
| Tabela **Meta — CPL po kampanji** | Leadovi koje Meta prijavljuje u **insights** (`actions` tipa lead) po **kampanji** i **publisher_platform** — realan CPL po oglasnoj kampanji |

### Preporučeni kod

Koristi dug, nasumičan string (npr. generisan na [random.org](https://www.random.org/strings/)).

## Praćenje (source_tag, UTM)

Pratimo **sve** UTM parametre i source_tag:

| Polje | Gde se čuva | Primer |
|-------|-------------|--------|
| source_tag | Supabase, Sheet | instagram, facebook, tiktok, direct, affiliate |
| utm_source | Supabase, Sheet | instagram, facebook, tiktok, ig, fb |
| utm_medium | Supabase, Sheet | cpc, organic |
| utm_campaign | Supabase, Sheet | prolece2026, kampanja_a |

**Razdvajanje Meta kampanja (Instagram vs Facebook):**
- **Instagram kampanja** — link u oglasu: `utm_source=instagram` (ili `ig`)
- **Facebook kampanja** — link u oglasu: `utm_source=facebook` (ili `fb`)

Meta Ads API povlači spend i leadove **posebno** po platformi (`publisher_platform`).

**TikTok** — link mora imati `utm_source=tiktok`.

## Real-time ažuriranje

Dashboard se automatski osvežava kad stigne novi lead:
- **Supabase Realtime** — pretplata na INSERT u tabeli `leads`
- **Polling** — svakih 20 sekundi ako Realtime nije aktivan

U Supabase Dashboard → Database → Replication: proveri da je tabela `leads` uključena za Realtime (ako ne radi automatsko osvežavanje).

## Izvori podataka

API kombinuje podatke iz **Leads by Source Sheet** i **Supabase**:
- **Sheet = primarni izvor** (pouzdaniji, često ima bolju atribuciju)
- Supabase = dopuna (leadovi koji nisu u Sheet-u)
- Za iste leadove (email + datum) Sheet ima prioritet

## Leads by Source Sheet — struktura

Sheet podržava **varijabilnu strukturu** (form, Make, Meta Lead Ads):
- Čita kolone A–Z
- Email: bilo koja ćelija koja izgleda kao email
- Datum: bilo koja ćelija u formatu YYYY-MM-DD
- source_tag: skenira sve ćelije za `ig`, `fb`, `tiktok`, `instagram`, `facebook`, `affiliate`

Primer: ako je email u koloni A, a source_tag u koloni D ili H — i dalje radi.

## Tabela leads u Supabase

Stranica čita podatke iz tabele `leads`. Potrebne kolone:
- `created_at`
- `source_tag`
- `utm_source`
- `utm_medium`
- `utm_campaign`

Ako tvoja tabela nema `source_tag` i UTM kolone, pokreni migraciju:
```sql
-- U Supabase SQL Editor
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_tag text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS affiliate_code text;
```

Fajl: `supabase-leads-utm-migration.sql`
