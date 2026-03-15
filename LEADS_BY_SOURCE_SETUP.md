# Leads by Source — Google Sheet + Make.com

Poseban Sheet za pregled leadova sa oznakom izvora (Meta/Facebook/Instagram, affiliate, direktan).

---

## Šta tačno označava — Leads by Source sheet i tag "affiliate"

### Šta je "Leads by Source" sheet?

**Leads by Source** (ili "Leads source" sheet) je **jedan** Google Sheet u koji idu **svi** leadovi sa sajta — bez obzira odakle su došli (direktno, sa Facebooka, sa affiliate linka, itd.). Svaki red = jedan lead (jedan submit forme).  

**Namena:** Na jednom mestu vidiš sve leadove i u istoj tabeli vidiš **iz kog kanala** je ko došao — zato postoji kolona **source_tag** (oznaka izvora). Nije za samo affiliate; affiliate leadovi su samo jedan od tipova koji se tu beleže.

**Razlika od Affiliate Sheet-a:**  
- **Leads by Source** = svi leadovi (affiliate + Facebook + Instagram + direktni + …), sa oznakom izvora u koloni `source_tag`.  
- **Affiliate Sheet** (AFFILIATE_SHEET_ID) = samo klikovi i leadovi koji su došli **preko affiliate linka**; ništa drugo se tamo ne upisuje.

---

### Šta znači tag "affiliate" (source_tag = affiliate)?

**Tag "affiliate"** znači: **lead je došao preko affiliate linka**.

Konkretno u kodu:
- Kad neko otvori link sa **?ref=CODE** ili **/ref/CODE**, sajt mu postavi cookie **af_ref** (na 30 dana).
- Kad ta ista osoba **submituje formu** (email, Join, Special), sajt proveri: da li postoji cookie **af_ref**?
  - Ako **da** → u Leads by Source (i u webhook payload) stavi **source_tag = "affiliate"** i u kolonu **affiliate_code** upiše taj kod (npr. DAMIJAN123).
  - Ako **ne** → source_tag bude npr. **"direct"** (ako nema ni UTM), ili **"facebook"** / **"instagram"** ako je došao sa UTM parametrima.

**Rečenica:**  
`source_tag = affiliate` = „Ovaj lead je submituovao formu **posle** što je ušao na sajt preko nekog affiliate linka“ (link sa ref kodom). U istom redu će u koloni **affiliate_code** stajati tačan kod (npr. NIKOLA777) da znaš koji je affiliate doveo tog leada.

---

## Šta se šalje

Kada neko submituje lead (homepage, Join, Special gate), API šalje webhook sa:

| Polje          | Opis                                           |
|----------------|------------------------------------------------|
| `date`         | ISO timestamp                                  |
| `email`        | Email leada                                    |
| `phone`        | Telefon (može biti prazan)                     |
| `name`         | Ime (Join ima, ostalo može biti prazno)        |
| `source_tag`   | **affiliate** \| **facebook** \| **instagram** \| **meta** \| **direct** |
| `utm_source`   | UTM source iz URL-a                            |
| `utm_medium`   | UTM medium                                     |
| `utm_campaign` | UTM campaign                                   |
| `affiliate_code` | Affiliate kod ako je došao preko ref linka   |

## Kako radi `source_tag`

- **affiliate** — ako ima cookie `af_ref` (došao preko `?ref=CODE` ili `/ref/CODE`)
- **instagram** — ako `utm_source` sadrži "instagram"
- **facebook** — ako `utm_source` sadrži "facebook" ili "fb"
- **meta** — ako `utm_source` sadrži "meta"
- **direct** — ostalo (direktan ulaz, bez UTM/ref)

## Setup

### 1. Google Sheet

Kreiraj Sheet sa zaglavljima u prvom redu:

| A: date | B: email | C: phone | D: name | E: source_tag | F: utm_source | G: utm_medium | H: utm_campaign | I: affiliate_code |
|---------|----------|----------|---------|---------------|---------------|---------------|-----------------|-------------------|

### 2. Make.com scenario

1. **Webhook** — Custom Webhook kao trigger
   - Kreiraj webhook, kopiraj URL
   - **Važno:** Klikni **Add** pored "Data structure" → izaberi **JSON** → zalepi:
   ```json
   {"date":"","email":"","phone":"","name":"","source_tag":"","utm_source":"","utm_medium":"","utm_campaign":"","affiliate_code":""}
   ```
   - Make tada zna kako da parsira JSON i prikaže polja kao `1.date`, `1.email` itd.

2. **Google Sheets** — Add row (ispod Webhook modula)
   - Spreadsheet: tvoj Leads by Source Sheet
   - Sheet: ime lista (npr. "Sheet1")
   - **Values** — Add item za svaku kolonu, mapiraj iz Webhook modula [1]:
     - A → `{{1.date}}`   B → `{{1.email}}`   C → `{{1.phone}}`
     - D → `{{1.name}}`   E → `{{1.source_tag}}`   F → `{{1.utm_source}}`
     - G → `{{1.utm_medium}}`   H → `{{1.utm_campaign}}`   I → `{{1.affiliate_code}}`

### 3. Vercel env

Dodaj u Vercel → Settings → Environment Variables:

```
LEADS_SOURCE_WEBHOOK_URL=https://hook.eu2.make.com/xxxxx
```

(URL iz Make.com Webhook modula)

### 4. Redeploy

Nakon dodavanja env varijable, redeploy aplikacije da env učita.

---

## Testiranje

1. **Affiliate:** Otvori `https://tvoj-domen.com?ref=TEST123` → submit lead → u Sheetu treba `source_tag: affiliate`, `affiliate_code: TEST123`
2. **Facebook:** Otvori `https://tvoj-domen.com?utm_source=facebook` → submit → `source_tag: facebook`
3. **Instagram:** Otvori `https://tvoj-domen.com?utm_source=instagram` → submit → `source_tag: instagram`
4. **Direct:** Otvori bez parametara → submit → `source_tag: direct`

## Meta Pixel

Meta Pixel već trackuje Lead event kada se forma submituje. Ovaj Sheet daje dodatni pregled: za svaki lead vidiš tačno odakle je došao (affiliate, FB, IG, direktan).

---

## Ne popunjava Sheet? Troubleshooting

### 1. Data structure u Webhook modulu

Ako polja kao `1.date` ne vidiš u mapiranju, Make ne parsira JSON.

- Otvori **Webhook** modul
- Klikni **Add** pored "Data structure"
- Izaberi **JSON**
- Zalepi: `{"date":"","email":"","phone":"","name":"","source_tag":"","utm_source":"","utm_medium":"","utm_campaign":"","affiliate_code":""}`
- Klikni OK, **Save** scenario
- Pošalji jedan test lead pa **Run once** (ili sačekaj da stigne) — sada bi trebalo da vidiš `1.date`, `1.email` itd.

### 2. Ako i dalje ne vidiš polja — probaj `1.body.xxx`

Neki Make webhooki stavljaju body u `body`. U Values probaj:
- `{{1.body.date}}`, `{{1.body.email}}`, itd.

### 3. Proveri Make History

- Make → Scenarios → tvoj scenario → **History**
- Da li se scenario uopšte pokreće kad submituješ lead?
  - Ako **NE** — webhook ne stiže. Proveri da li je `LEADS_SOURCE_WEBHOOK_URL` u Vercel env, redeploy, i da sajt šalje na pravi URL.
  - Ako **DA** — klikni na run pa vidi output Webhook modula. Tu vidiš tačnu strukturu podataka (npr. `body` vs root).

### 4. Ručni test webhooka

U Postman ili pregledniku (npr. ekstenzija) pošalji:
```
POST https://tvoj-make-webhook-url
Content-Type: application/json

{"date":"2025-03-10T12:00:00Z","email":"test@test.com","phone":"","name":"","source_tag":"direct","utm_source":"","utm_medium":"","utm_campaign":"","affiliate_code":""}
```
- Ako se u Sheet upiše red — problem je u sajtu (env, deploy, forma).
- Ako se ne upiše — problem je u Make scenariju (mapiranje ili Data structure).
