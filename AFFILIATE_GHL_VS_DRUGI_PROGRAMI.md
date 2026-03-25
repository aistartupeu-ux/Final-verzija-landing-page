## Affiliate program — kompletan vodič (GHL + 2 liste)

Ovaj dokument je **jedan celovit vodič** za ceo affiliate sistem: od ideje, preko arhitekture i računanja, do najsitnijih detalja setap-a (env varijable, kolone u Sheet-ovima, GHL workflow-i). Potpuni početnik može da ga prati korak po korak.

Radićemo 3 stvari:

1. **Affiliate linkovi** – da znamo ko je doveo osobu (affiliate kod u URL-u).  
2. **Lista leadova** – prva lista: svi ljudi koje je affiliate doveo.  
3. **Lista kupovina/prijava** – druga lista: ko je stvarno kupio ili se prijavio + provizije.

Na kraju ćeš imati:

- u **GoHighLevel** kontaktu: ko ga je doveo (affiliate kod),  
- u **Sheet-ovima**: jasno odvojeno “koliko ih je doveo” i “koliko je kupilo/prijavilo se” + provizije.

---

## 0. Arhitektura sistema i tok podataka (pregled)

Pre nego što kreneš korak po korak, evi kako se sve povezuje i gde šta završava.

### 0.1. Dva tipa Google Sheet-a (ne mešaj ih)

| Šta | Env varijabla | Šta sadrži |
|-----|----------------|------------|
| **Leads by Source** (glavna lista leadova) | `LEADS_SHEET_ID` | Jedan spreadsheet, jedan tab (npr. Sheet1): **svi** leadovi sa sajta – i oni sa `?ref=`, i direktni. Kolone: date, email, phone, name, source_tag, utm_*, affiliate_code. |
| **Affiliate Sheet** (samo affiliate podaci) | `AFFILIATE_SHEET_ID` | Jedan spreadsheet sa **tri taba**: **Clicks**, **Leads**, **Conversions**. Samo događaji vezani za affiliate (klikovi na ref link, leadovi sa ref=, konverzije). |

- **LEADS_SHEET_ID** → puni ga **samo** `/api/leads` (kad neko submituje glavnu formu).  
- **AFFILIATE_SHEET_ID** → puni ga **`/api/affiliate/track`** (Clicks + Leads) i **`/api/affiliate/conversion`** (Conversions).

Možeš imati i oba (dva različita spreadsheet-a), ili jedan spreadsheet za “sve leadove” (LEADS_SHEET_ID) i drugi za “affiliate Clicks/Leads/Conversions” (AFFILIATE_SHEET_ID). Ne mešaj kolone iz jednog u drugi.

### 0.2. Tok od klika do konverzije (kratko)

1. **Klik na affiliate link**  
   `https://tvoj-domen.com/?ref=damijan01` → sajt čita `ref`, upisuje u cookie `af_ref`, opciono šalje **click** na `/api/affiliate/track` (event_type: click) → upis u **Supabase** (`affiliate_clicks`) i u **Affiliate Sheet** tab **Clicks**.

2. **Submit lead forme**  
   Forma šalje email/phone (+ cookie `af_ref`) na **`/api/leads`** → upis u **Supabase** (`leads`), slanje na **GHL webhook** (da se napravi/ažurira kontakt i polje Affiliate Code), upis u **LEADS_SHEET** (Leads by Source). Ako je bio `af_ref`, dodatno se šalje **lead** na **`/api/affiliate/track`** (event_type: lead) → upis u **Affiliate Sheet** tab **Leads**.

3. **Kupovina**  
   U GHL-u menjaš status opportunity-ja na “Kupio” (ili sl.) → workflow šalje **webhook** na **`/api/affiliate/conversion`** sa email, affiliate_code, orderAmount, itd. → endpoint proverava affiliate u **Supabase** (`affiliates`), računa proviziju, upisuje u **Supabase** (`affiliate_conversions`) i u **Affiliate Sheet** tab **Conversions**.

### 0.3. Gde se šta računa i čuva

- **Provizija** – računa je **samo** `/api/affiliate/conversion`: `commission_amount = order_amount * (commission_rate / 100)`. `commission_rate` dolazi iz **Supabase** tabele **`affiliates`** (kolona `commission_rate`, default 30 = 30%).  
- **Broj leadova** – broj redova u tabu **Leads** (Affiliate Sheet) ili u LEADS_SHEET-u filtriranih po `affiliate_code`.  
- **Broj konverzija** – broj redova u tabu **Conversions** (Affiliate Sheet) za tog affiliate-a.  
- **Ukupno za isplatu** – zbir kolone `commission_amount` u tabu **Conversions** za tog affiliate-a (npr. `=SUMIF` ili filter + SUBTOTAL).

---

## 0.4. Sve env varijable (jedna referenca)

Sve stavljaš u **Vercel** (Projekt → Settings → Environment Variables). Za produkciju podesi **Production**.

| Env varijabla | Obavezna? | Gde se koristi | Šta uneti |
|---------------|-----------|----------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Da | Sajt + API | URL Supabase projekta (npr. https://xxx.supabase.co). |
| `SUPABASE_SERVICE_ROLE_KEY` | Da | API (leads, affiliate track, conversion) | Service role key iz Supabase (Dashboard → Settings → API). **Ne** anon key. |
| `GHL_WEBHOOK_URL` | Ako koristiš GHL | `/api/leads` | URL GHL Inbound Webhook za nove leadove (kopiraj iz Workflow → Webhook trigger). |
| `LEADS_SHEET_ID` | Ako želiš glavnu listu leadova u Sheet | `/api/leads` | ID Google Sheet-a: iz URL-a `https://docs.google.com/spreadsheets/d/OVDE_ID/edit` kopiraj **OVDE_ID** (niz slova/cifara). |
| `LEADS_SHEET_NAME` | Opciono | `/api/leads` | Ime taba (npr. Sheet1). Ako ne staviš, koristi se prvi tab. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Da (za bilo koji Sheet) | `/api/leads`, `/api/affiliate/track`, `/api/affiliate/conversion` | Ceo JSON ključ Google Service Account-a (jedan string). Kako ga dobiti: Google Cloud Console → IAM → Service Accounts → Create → Keys → Add key → JSON. Zatim taj JSON zalepi kao vrednost (može u jednom redu sa escape-om ili u Vercel multi-line). |
| `AFFILIATE_SHEET_ID` | Ako želiš Clicks/Leads/Conversions u Sheet | `/api/affiliate/track`, `/api/affiliate/conversion` | ID **drugog** Google Sheet-a (samo za affiliate). Isti format: ID iz URL-a. Ovaj Sheet mora imati tabove **Clicks**, **Leads**, **Conversions** (ili imena koja podesiš ispod). |
| `AFFILIATE_SHEET_CLICKS_NAME` | Opciono | affiliate track | Ime taba za klikove. Default: **Clicks**. |
| `AFFILIATE_SHEET_LEADS_NAME` | Opciono | affiliate track | Ime taba za leadove. Default: **Leads**. |
| `AFFILIATE_SHEET_CONVERSIONS_NAME` | Opciono | conversion | Ime taba za konverzije. Default: **Conversions**. |
| `MAKE_WEBHOOK_URL` | Opciono | `/api/affiliate/track` | Ako koristiš Make.com za affiliate evente. Ako koristiš samo AFFILIATE_SHEET_ID, ne mora. |
| `LEADS_SOURCE_WEBHOOK_URL` | Opciono | `/api/leads` | Npr. Make webhook za “Leads by Source” ako želiš duplikat negde drugde. |
| `IPAPI_API_KEY` | Opciono | `/api/leads` | Za geo (grad/država) po IP. Bez ključa ipapi radi sa ograničenjem. |

**Kako dobiti Sheet ID:** Otvori Google Sheet u browseru. URL je tipa `https://docs.google.com/spreadsheets/d/1ABC...xyz/edit`. Deo između `/d/` i `/edit` je **Sheet ID**.  
**Service Account i deljenje:** U Google Cloud kreiraš Service Account, preuzmeš JSON. U JSON-u nađeš polje `client_email` (npr. `something@project.iam.gserviceaccount.com`). U Google Sheet-u klikneš **Share**, dodaš taj email sa pravom **Editor**, da aplikacija može da upisuje redove.

---

## 0.5. Kako se tačno računa provizija i šta je u bazi

- **Formula:**  
  `commission_amount = order_amount * (commission_rate / 100)`  
  Primer: order_amount = 100 EUR, commission_rate = 30 → commission_amount = 30 EUR.

- **Odakle `commission_rate`:**  
  Iz **Supabase** tabele **`affiliates`**, kolona **`commission_rate`** (broj, npr. 30 za 30%). Pri registraciji affiliate-a (npr. preko `/api/affiliate/register`) možeš u kodu postaviti default (npr. 30). Kasnije možeš ručno u Supabase-u za svakog affiliate-a promeniti `commission_rate` (npr. 20 ili 40).

- **Šta se upisuje u bazu (Supabase):**  
  - **`leads`** – svaki submit glavne forme (email, phone, city, country, ip, itd.).  
  - **`affiliates`** – jedan red po affiliate-u (name, email, password_hash, **affiliate_code**, **commission_rate**, status).  
  - **`affiliate_clicks`** – svaki klik na ref link (affiliate_id, ip_address, user_agent, referrer, created_at).  
  - **`affiliate_conversions`** – svaka konverzija (affiliate_id, click_id opciono, order_amount, commission_amount, status, created_at).

Ako želiš da neki affiliate ima 20% umesto 30%, u Supabase u tabeli `affiliates` za tog affiliate-a staviš `commission_rate = 20`. Endpoint `/api/affiliate/conversion` uvek čita tu vrednost i računa proviziju.

---

## 0.6. Tačan redosled kolona u svakom Sheet-u (da ne grešiš)

Kod upisuje redove **bez** header reda – podaci idu redom u kolone. Ako staviš header u red 1, podaci će od reda 2. Redosled kolona **mora** da bude ovaj:

**LEADS_SHEET (Leads by Source) – tab koji koristi `/api/leads`:**

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| date | email | phone | name | source_tag | utm_source | utm_medium | utm_campaign | affiliate_code |

**AFFILIATE_SHEET – tab Clicks:**

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| clicked_at | affiliate_code | visitor_id | page_url | utm_source | utm_campaign |

**AFFILIATE_SHEET – tab Leads:**

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| created_at | email | phone | affiliate_code | visitor_id | page_url | utm_source | utm_campaign | status |

**AFFILIATE_SHEET – tab Conversions:**

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| created_at | email | phone | affiliate_code | order_amount | currency | order_id | conversion_type | commission_rate | commission_amount | status |

Ako napraviš tab sa drugim redosledom, formule (SUMIF, filteri) će biti pogrešne. Možeš u red 1 staviti ove naslove kao header, a podaci će ići ispod.

---

## 1. Osnovna ideja (da znaš šta radiš)

- Svaki affiliate dobije **svoj kod** – npr. `marko10`, `ivaYT`, `tiktok01`…  
- Kada neko klikne njihov link, kod ide u URL, npr:  
  - `https://tvoj-domen.com/?ref=marko10`
- Taj kod:
  - sajt upiše u **cookie** (da ga “pamti”),  
  - pošalje zajedno sa prijavom u **GoHighLevel** kao polje `affiliate_code`,  
  - i/ili ga upiše u **tabelu “LEADOVI”** (prva lista).
- Kada ta osoba **kupi** ili se **prijavi za program**, opet prosledimo isti `affiliate_code` i upišemo u drugu tabelu **“KUPCI / KONVERZIJE”**.

Tako uvek znamo:

- koliko je ljudi affiliate doveo (lista leadova),  
- koliko ih je kupilo ili se prijavilo (lista kupaca/konverzija),  
- koliko mu sleduje provizija.

---

## 2. Korak 1 — Kreiranje affiliate kodova i linkova  *(TI radiš)*

Ovo možeš da radiš u običnom **Google Sheet / Excelu**.

1. Otvori novi Google Sheet (ili Excel fajl) i nazovi ga npr. **`AFFILIATE_PARTNERI`**.  *(TI)*
2. Napravi kolone:
   - `affiliate_id` – interni ID (1, 2, 3… ili A1, A2… možeš i da preskočiš ako želiš).  
   - `affiliate_ime` – ime partnera (npr. “Marko Marković”).  
   - `affiliate_kod` – unikatni kod, npr. `marko10`, `ivaYT`, `tiktok01`.  
   - `kanal` – npr. Instagram, YouTube, TikTok, email lista… (opciono).  
   - `napomena` – dodatne beleške (opciono).

3. Za svakog affiliate-a:  *(TI)*
   - smislite i upišite **jedinstven kod** u kolonu `affiliate_kod`.  
   - kod neka bude kratak i čitljiv (bez razmaka, samo mala slova/brojevi).
   - **preporuka:** koristi samo lowercase (npr. `damijan01`) da sve bude 1:1 u Sheet-u i u GHL-u.

   **Primer za prvog affiliate-a (Damijan):**
   - `affiliate_ime` = `Damijan`  
   - `affiliate_kod` = `damijan01`  
   - affiliate link: `https://tvoj-domen.com/?ref=damijan01`

4. Njihov **affiliate link** biće:
   - ako koristiš parametar: `https://tvoj-domen.com/?ref=affiliate_kod`  
     - primer za Marka: `https://tvoj-domen.com/?ref=marko10`
   - ako koristiš poseban path (opciono): `https://tvoj-domen.com/ref/marko10`

5. Pošalji affiliate-u njegov link:  *(TI)*
   - “Tvoj affiliate link je: `https://tvoj-domen.com/?ref=marko10`. Uvek koristi ovaj link u opisima videa, bio, porukama itd.”

Do ovog trenutka si **samo definisao linkove i kodove** – još ništa ne meriš, ali je baza spremna.

---

## 3. Korak 2 — Šta treba da radi sajt (osnova)  *(DEVELOPER radi)*

Ovo je deo koji će uglavnom odraditi developer, ali je važno da **razumeš logiku**.

Kada neko dođe na `https://tvoj-domen.com/?ref=marko10`:

1. **Sajt pročita `ref` parametar iz URL-a**:  *(DEVELOPER implementira)*
   - `ref=marko10`
2. Sajt upiše taj kod u **cookie** (npr. `af_ref = "marko10"`), sa rokom trajanja (npr. 30 dana).  *(DEVELOPER implementira)*  
3. Kada osoba popuni formu (newsletter, prijava, lead forma):  *(DEVELOPER implementira)*
   - backend preuzme vrednost cookie-ja `af_ref`,  
   - i pošalje je zajedno sa ostalim podacima dalje (GHL + tabele).

Bitno:  
Ako osoba prvo klikne na affiliate link, pa posle 3 dana sama dođe na sajt i popuni formu, cookie će i dalje imati `marko10` i znaćemo ko ju je prvi doveo.

✅ **Status u ovom projektu:** ovo je već implementirano u kodu (cookie `af_ref`, slanje `affiliate_code` u `/api/leads` i GHL webhook).

---

## 4. Korak 3 — GoHighLevel setap (da u kontaktu vidiš ko ga je doveo)
    
Ovde cilj nije da radimo ceo affiliate portal u GHL, već:

- svaki **kontakt** u GHL-u ima polje npr. **`Affiliate Code`**,  
- u to polje se upisuje kod (npr. `marko10`),  
- ti posle možeš da filtriraš kontakte po tom kodu.

### 4.1. Napravi custom field za affiliate kod  *(TI možeš da uradiš)*

1. Uđi u svoj **GoHighLevel** nalog.  *(TI)*
2. Idi na nivo **subaccount** gde ti je projekat.  
3. Idi na: **Settings → Custom Fields**.  
4. Klikni na **Add Field**.  
5. Izaberi tip polja:  
   - `Text` ili `Single line text`.  
6. Naziv polja:  
   - `Affiliate Code` (ili `Referral Source` – bitno da ga pamtiš).  
7. Sačuvaj.

Zapamti tačan naziv polja, trebaće u mapi/webhooku.

### 4.2. Provera webhook‑a / integracije sa sajta  *(DEVELOPER radi)*

Ovo zavisi od toga kako ti je backend već povezan, ali ideja je uvek ista:

- Kada sajt pošalje lead na backend (`/api/leads` ili slično), backend:
  - prosleđuje podatke u GHL preko **webhooka**,  
  - u payloadu šalje i polje `affiliate_code` (ili slično ime).

Treba da se pobrineš da:

1. U backend payloadu (koji ide ka GHL-u) postoji **ključ**: npr. `"affiliate_code": "marko10"`.  *(DEVELOPER)*  
2. U GHL‑u u sekciji **Workflows** imaš workflow koji:  *(TI ili DEVELOPER – ko više radi u GHL-u)*
   - trigeruje se kada stigne novi lead (npr. “When Webhook Received” ili “Contact Created/Updated”),  
   - u jednoj od akcija **upisuje vrednost** iz webhook polja `affiliate_code` u custom field `Affiliate Code`.

To se obično radi ovako:

1. U **Workflows** napravi novi workflow (ili otvori postojeći za nove leadove).  *(TI ili DEVELOPER)*  
2. Kao **Trigger** stavi ono što već koristiš (npr. “Contact Created”).  
3. Dodaj akciju tipa **“Update Contact”**.  
4. U toj akciji pronađi custom field `Affiliate Code`.  
5. Kao vrednost izaberi polje koje dolazi iz webhook-a / forme (npr. `affiliate_code`).  
6. Sačuvaj i aktiviraj workflow.

Rezultat: kad god novi lead dođe iz sajta, u njegovom **Contact** profilu u GHL-u videćeš:

- `Affiliate Code = marko10` (ili koji već kod).

---

## 5. Korak 4 — Prva lista: “Koliko ljudi su doveli” (LEADOVI)  *(AUTOMATSKI)*

U ovom projektu postoje **dve liste leadova** (vidi sekciju 0.1):

1. **Leads by Source** – jedan spreadsheet (`LEADS_SHEET_ID`): **svi** leadovi sa sajta (i sa ref= i bez). Puni ga **samo** `/api/leads`.
2. **Affiliate Sheet, tab Leads** – drugi spreadsheet (`AFFILIATE_SHEET_ID`), tab **Leads**: samo leadovi koji su došli **preko affiliate linka** (imaju `affiliate_code`). Puni ga **`/api/affiliate/track`** (event_type: lead) nakon što je `/api/leads` već obradio formu.

Obe liste se pune **automatski**, bez ručnog unosa. Ako želiš samo “koliko je ko doveo”, dovoljno je tab **Leads** u Affiliate Sheet-u. Ako želiš i jednu centralnu listu svih leadova (sa source_tag, UTM, affiliate_code), napravi i spreadsheet za `LEADS_SHEET_ID`.

✅ **Status u ovom projektu:** submit forme poziva `/api/leads` (Supabase + GHL + LEADS_SHEET) i, ako postoji cookie `af_ref`, dodatno `/api/affiliate/track` sa event_type lead (Supabase + Affiliate Sheet tab Leads).

### 5.1. Napravi Google Sheet(e) za leadove (jednom)

**Opcija A – Samo Affiliate Sheet (Clicks + Leads + Conversions):**

1. Jedan Google Sheet, naziv npr. **AHA_Affiliate_System**.  
2. Tri taba: **Clicks**, **Leads**, **Conversions**.  
3. U tab **Leads** u red 1 stavi zaglavlja (redosled kolona **mora** biti kao u sekciji 0.6):  
   `created_at` | `email` | `phone` | `affiliate_code` | `visitor_id` | `page_url` | `utm_source` | `utm_campaign` | `status`  
4. U Vercel stavi **`AFFILIATE_SHEET_ID`** = ID tog spreadsheet-a i **`GOOGLE_SERVICE_ACCOUNT_JSON`**.  
5. Share spreadsheet sa service account email-om (Editor).

**Opcija B – I “Leads by Source” (svi leadovi):**

1. Drugi Google Sheet, npr. **Leads_By_Source**.  
2. Jedan tab (npr. Sheet1). Red 1: zaglavlja prema 0.6 – `date` | `email` | `phone` | `name` | `source_tag` | `utm_source` | `utm_medium` | `utm_campaign` | `affiliate_code`.  
3. U Vercel stavi **`LEADS_SHEET_ID`** = ID tog spreadsheet-a (isti **`GOOGLE_SERVICE_ACCOUNT_JSON`** može).  
4. Share i ovaj Sheet sa service account email-om.

### 5.2. Kako se puni lista leadova (automatski)

- Lead forma na sajtu šalje podatke na **`/api/leads`**.  
- Backend čita cookie **`af_ref`** i u payload dodaje **`affiliate_code`**.  
- **`/api/leads`** upisuje u Supabase (`leads`), šalje na GHL webhook, i **append-uje red** u spreadsheet iz **`LEADS_SHEET_ID`** (ako je podešen).  
- Ako je **`af_ref`** bio setovan, frontend (ili backend) šalje i zahtev na **`/api/affiliate/track`** sa `event_type: "lead"` → to upisuje red u **Affiliate Sheet, tab Leads** (ako je `AFFILIATE_SHEET_ID` podešen).

Ti ovde **ne unosiš ništa ručno** – samo jednom napraviš Sheet(e) i podesiš env varijable (0.4).

### 5.3. Šta dobijaš od ove tabele

Za svakog affiliate-a možeš da filtriraš:

- `affiliate_code = damijan01` → vidiš **sve leadove** koje je Damijan doveo.  
- Možeš da prebrojiš redove → **broj ljudi koje je doveo**.

Ovo je **prva lista** koju si tražio: “koliko ljudi su doveli”.

---

## 6. Korak 5 — Druga lista: “Koliko je ljudi kupilo / prijavilo se” (KONVERZIJE)  *(AUTOMATSKI)*

Ova lista beleži **samo ljude koji su uradili ciljnu akciju**:

- kupili program/proizvod,  
- ili se zvanično prijavili (npr. potpisali ugovor, odobrili uplatu, itd.).

### 6.1. Napravi Google Sheet za konverzije (jednom)

1. Otvori novi Google Sheet i nazovi ga npr. **`AFFILIATE_KONVERZIJE`**.  *(TI)*
2. Napravi sledeće kolone (red 1 su nazivi kolona):
   - `created_at`
   - `email`
   - `phone`
   - `affiliate_code`
   - `order_amount`
   - `currency`
   - `order_id`
   - `conversion_type`
   - `commission_rate`
   - `commission_amount`
   - `status`

3. Sačuvaj Sheet.

### 6.2. Kako se puni lista konverzija (automatski)

Tab **Conversions** u Affiliate Sheet-u ne puniš ručno. Puni ga **sajt** kada neko obavi kupovinu (ili prijavu za program), a ti u **GoHighLevel-u** samo pokreneš taj događaj preko workflow-a koji šalje webhook na naš endpoint.

#### Šta tačno radi endpoint `/api/affiliate/conversion`

1. **Prima POST zahtev** sa JSON telom (npr. iz GHL Workflow → Webhook akcije).
2. **Proverava obavezna polja:** mora da postoji `orderAmount` (ili `order_amount`) veći od 0. Bez iznosa narudžbine endpoint vraća grešku.
3. **Utvrđuje affiliate-a:** traži u payload-u polje `affiliate_code` (ili iz cookie-a `af_ref`, što u praksi važi samo ako poziv dolazi iz browsera; za GHL webhook **mora** da se šalje `affiliate_code` u telu).
4. **U bazi (Supabase):** proverava da li postoji aktivan affiliate sa tim kodom; ako ne – vraća `attributed: false` i ne upisuje ništa u Sheet.
5. **Računa proviziju:** koristi `commission_rate` tog affiliate-a iz tabele `affiliates` i izračunava `commission_amount`.
6. **Upisuje u Supabase** u tabelu `affiliate_conversions` (povezuje konverziju sa `affiliate_id` i opciono sa poslednjim klikom).
7. **Upisuje jedan red u Google Sheet** u tab **Conversions** (ako su u Vercel-u podešeni `AFFILIATE_SHEET_ID` i `GOOGLE_SERVICE_ACCOUNT_JSON`). Red sadrži: datum, email, phone, affiliate_code, order_amount, currency, order_id, conversion_type, commission_rate, commission_amount, status.

Ti ovde **ništa ne unosiš ručno** – sve ide automatski kad GHL pošalje webhook na taj endpoint.

#### Kako da u GHL-u pošalješ webhook kada neko kupi

1. Uđi u **Automation** (ili **Workflows**) u GHL-u.
2. Otvori workflow koji se pokreće kada se **Opportunity** (ili narudžbina) stavi u status tipa **“Kupio”** / **“Won”** / **“Sale”** (kako god da si nazvao završni korak).
3. U tom workflow-u **dodaj akciju** tipa **Webhook** (ili **Outbound Webhook**).
4. **URL** postavi na tvoj produkcioni domen, npr:  
   `https://tvoj-domen.com/api/affiliate/conversion`  
   (mora HTTPS i tačna putanja).
5. **Method:** POST.  
   **Body type:** JSON.
6. U telo (Body) unesi vrednosti – GHL obično dozvoljava **merge fields** iz kontakta i opportunity-ja, npr:
   - `email` → `{{contact.email}}`
   - `phone` → `{{contact.phone}}`
   - `affiliate_code` → `{{contact.affiliate_code}}` ili custom field gde čuvaš affiliate kod (npr. **Affiliate Code**)
   - `orderAmount` → iznos iz opportunity-ja (npr. `{{opportunity.value}}` ili broj koji uneseš)
   - `currency` → npr. `EUR` ili merge field ako ga imaš
   - `orderId` → `{{opportunity.id}}` ili slično (opciono)
   - `conversionType` → npr. `purchase` ili `signup` (opciono, default je `purchase`)

Bez **affiliate_code** u payload-u konverzija se neće pripisati nijednom affiliate-u i u Sheet neće ući red (endpoint i dalje vraća 200 da GHL ne retry-uje).

#### Primer payload-a koji GHL treba da pošalje

```json
{
  "email": "kupac@example.com",
  "phone": "+38160123456",
  "affiliate_code": "damijan01",
  "orderAmount": 497,
  "currency": "EUR",
  "orderId": "GHL-OPP-123",
  "conversionType": "purchase"
}
```

Imena polja mogu biti i u “snake_case” varijanti: `order_amount`, `order_id`, `conversion_type`, `affiliate_code` – endpoint prihvata obe forme.

#### Šta proveriti ako se Sheet ne puni

- Da li u Vercel env stoje **`AFFILIATE_SHEET_ID`** (ID spreadsheet-a) i **`GOOGLE_SERVICE_ACCOUNT_JSON`** (ceo JSON ključ service account-a).
- Da li je **Affiliate Sheet** (taj spreadsheet) **deljen** sa service account email-om (npr. `xxx@yyy.iam.gserviceaccount.com`) sa pravom **Editor**.
- Da li u GHL webhook-u **zaista šalješ `affiliate_code`** (iz custom polja kontakta) i **`orderAmount`** (broj veći od 0).
- U Vercel logovima (Functions) možeš videti da li `/api/affiliate/conversion` vraća grešku ili “Server greška” – to ukazuje na problem sa Supabase ili Sheet-om.

---

### 6.3. Šta dobijaš od ove tabele

Tab **Conversions** je tvoja **evidencija kupovina/prijava** po affiliate-u.

- Za svakog affiliate-a (npr. Damijan): u Sheet-u uključiš **Filter** na kolonu `affiliate_code` i izabereš `damijan01`. Tada vidiš **sve redove** (sve konverzije) koje su pripisane njemu.
- Broj redova = broj konverzija (koliko je ljudi kupilo / prijavilo se preko njega).
- Kolona **`commission_amount`**: za filtrirane redove možeš u praznu ćeliju staviti formulu **`=SUM(K:K)`** (ako je provizija u koloni K) ili označiti ćelije i pogledati zbir na dnu – to je **ukupno koliko mu duguješ** (provizije).

Ovo je **druga lista** koju si tražio: “koliko je ljudi obavilo kupovinu ili prijavu” i “koliko para je ko zaradio”.

---

## 7. Kako da povežeš obe liste (leadovi + konverzije)

Obe liste (leadovi u jednom Sheet-u/tabu, konverzije u drugom) imaju zajednička polja po kojima ih povezuješ:

- **`email`** – glavni način da prepoznaš istu osobu u obe tabele.  
- **`affiliate_code`** – da vidiš ko je doveo tu osobu.

Opciono kasnije možeš uvesti i **`lead_id`** (jedinstveni broj leada) da veza bude još čista.

### 7.1. Povezivanje preko email adrese (korak po korak)

Kada želiš da vidiš “put” jedne osobe od leada do kupovine:

1. Otvori Sheet/tab **AFFILIATE_LEADOVI** (ili tab **Leads** u Affiliate Sheet-u).  
2. Koristi **Filter** (Data → Create a filter) ili Ctrl+F i u koloni **email** ukucaj email te osobe (npr. `ana@example.com`).  
3. Ako postoji red sa tim emailom – vidiš **kada** je postala lead (kolona `date` / `created_at`), preko kog affiliate-a (`affiliate_code`) i eventualno UTM izvore.  
4. Otvori Sheet/tab **AFFILIATE_KONVERZIJE** (tab **Conversions**).  
5. U istoj tabeli uključi filter na kolonu **email** i ukucaj isti `ana@example.com`.  
6. Ako se pojavi red – ta osoba je i kupila/prijavila se; vidiš iznos narudžbine, proviziju i affiliate-a koji je doveo.  
7. Zaključak: ista osoba se pojavila prvo kao lead (u listi leadova), pa kao konverzija (u listi konverzija) – znaš ceo put i možeš da proveriš da li je affiliate kod isti u oba mesta.

### 7.2. Povezivanje preko `lead_id` (naprednija, ali čista)

Ako želiš strožiju vezu “jedan lead = jedan ID”:

1. U tabeli **AFFILIATE_LEADOVI** dodaj kolonu **`lead_id`**. Svakom novom leadu (ručno ili formulom) dodeli jedinstveni broj (1, 2, 3 … ili auto-increment).  
2. Kada ta ista osoba kupi, u GHL workflow-u koji šalje webhook na `/api/affiliate/conversion` trenutno ne šaljemo `lead_id` – endpoint ga ne upisuje. Da bi ga imao u **Conversions**, morao bi u GHL-u da imaš način da “nađeš” lead_id za tog kupca (npr. custom field na kontaktu “Lead ID”) i da ga uključiš u webhook payload. Zatim u kodu endpoint-a i u Sheet koloni dodaješ `lead_id` i upisuješ ga.  
3. Kad to uradiš: u **Conversions** tabu svaki red može imati isti `lead_id` kao tačno jedan red u **Leads** – u Looker Studio (ili sličnom alatu) možeš praviti izveštaje po lead_id (npr. vreme od leada do kupovine).

Za početak dovoljno je povezivanje preko **email** + **affiliate_code**.

---

## 8. Mini-dashboards za početnike (bez kodiranja)  *(TI)*

Sve možeš da uradiš direktno u Google Sheet-u, bez dodatnog softvera – filteri i jednostavne formule su dovoljni.

### 8.1. “Koliko ljudi je doveo affiliate X”

Koristiš tab **Leads** (ili listu koju zoveš AFFILIATE_LEADOVI) u Affiliate Sheet-u.

1. Klikni bilo gde unutar podataka (npr. unutar tabela sa kolonama `email`, `affiliate_code`, itd.).  
2. U meniju izaberi **Data → Create a filter** (ili ikonu filtera u toolbar-u). Na vrhu kolona pojaviće se mala ikonica filtera.  
3. Klikni na strelicu pored zaglavlja kolone **`affiliate_code`**.  
4. U listi vrednosti **odčekiraj “Select all”**, pa **čekiraj samo jedan kod**, npr. `marko10` (ili `damijan01`). Potvrdi.  
5. Sheet će prikazati **samo redove** gde je `affiliate_code` jednak tom kodu – dakle sve leadove koje je doveo taj affiliate.  
6. Da vidiš **broj** tih leadova:  
   - možeš jednostavno pogledati koliko ima vidljivih redova, ili  
   - u neku praznu ćeliju (npr. ispod tabele) unesi formulu **`=SUBTOTAL(103, A2:A1000)`** ako je email u koloni A (103 = count only visible rows); kada menjaš filter, broj se automatski ažurira.  
   Alternativa: **`=COUNTA(B2:B1000)`** ako filtriraš tako da su vidljivi samo redovi tog affiliate-a (B = kolona sa emailom).

### 8.2. “Koliko kupovina / koliko para je doneo affiliate X”

Koristiš tab **Conversions** u istom Affiliate Sheet-u.

1. Uključi **Filter** na ovu tabelu (Data → Create a filter).  
2. U koloni **`affiliate_code`** otvori filter i izaberi samo jedan kod, npr. `damijan01`.  
3. **Broj konverzija** = broj preostalih (vidljivih) redova. Možeš opet koristiti **`=SUBTOTAL(103, A2:A500)`** za prebrojavanje samo vidljivih redova (zameni A sa kolonom gde imaš bilo koji podatak u svakom redu).  
4. **Ukupna provizija:** pretpostavi da je kolona **`commission_amount`** npr. u koloni **K**. U praznu ćeliju (ispod tabele ili sa strane) unesi **`=SUBTOTAL(109, K2:K500)`** (109 = sum only visible rows). Kada menjaš filter na `affiliate_code`, zbir se ažurira samo za tog affiliate-a.  
   Ako ne koristiš filter već želiš zbir samo za jedan kod, možeš koristiti **`=SUMIF(A2:A500, "damijan01", K2:K500)`** gde je A kolona `affiliate_code`, a K kolona `commission_amount`.

Tako, bez ikakvog posebnog softvera, imaš:

- **koliko je leadova** doveo affiliate X,  
- **koliko je kupovina** (konverzija) ostvario,  
- **koliko para** (provizija) mu duguješ – zbir kolone `commission_amount`.

---

## 9. GHL Affiliate Portal — da affiliate vidi svoj dashboard na telefonu  *(TI ili DEVELOPER, zavisi ko klika po GHL-u)*

Ako tvoj GHL plan ima **Affiliate / Referral / Affiliate Manager** modul, možeš da pružiš affiliate-ima **portal** koji otvaraju u browseru (uključujući mobilni) i gde vide svoje linkove i brojke.

### 9.1. Šta taj portal radi (osnovno)

Zavisno od GHL plana i verzije, modul tipično nudi:

- **Login** za affiliate-a (email + lozinka ili jednokratni “invite” link).  
- **Pregled sopstvenih linkova** – link(ovi) koje koristi za deljenje (npr. tvoj domen sa `?ref=CODE`).  
- **Brojke:** broj klikova, broj leadova, broj konverzija (kupovina), iznos provizije – u granicama onoga što GHL sam prati ili što ti ručno/automatski unosiš.  
- **Responzivan prikaz** – prilagođen mobilnom, tako da affiliate može sve da vidi sa telefona u browseru.

### 9.2. Koraci da ga uključiš (za početnika, korak po korak)

1. Uloguj se u **GoHighLevel** na nalog gde držiš ovaj projekat (agency ili subaccount).  
2. Uđi u **subaccount** koji koristiš za AI Hype Akademiju (ili onaj gde su kontakti i opportunity-ji).  
3. U **glavnom meniju** (levo ili gore) potraži jednu od sekcija:  
   - **Marketing** → pa **Affiliate Manager** / **Affiliates**, ili  
   - **Affiliate**, **Referral Program**, **Partners** – naziv zavisi od verzije GHL-a.  
4. Ako modul postoji ali nije uključen:  
   - traži dugme tipa **Enable**, **Activate**, **Set up affiliate program**;  
   - klikni i prođi kroz kratki setup (naziv programa, tip provizije – npr. procenat od prodaje – i slično).  
5. Ako u meniju uopšte nemaš opciju za Affiliate / Referral, tvoj plan verovatno ne uključuje taj modul – tada ostaješ na Google Sheet + ručni (ili email) izveštaji za affiliate-e.

### 9.3. Povezivanje sa našim `Affiliate Code` poljem

Da bi brojke u portalu imale smisla, poželjno je da GHL “zna” koji kontakt pripada kom affiliate-u. To radiš preko custom polja **Affiliate Code** na kontaktu.

1. U GHL affiliate modulu obično postoji **dodavanje affiliate-a**: unesi **ime** i **email** (i po želji druge podatke).  
2. **Affiliate link:** nekad GHL sam generiše link (svoj URL sa parametrom), nekad možeš da uneseš/izabereš **svoj** format. Kod nas link je tipa `https://tvoj-domen.com/?ref=damijan01`. U GHL-u treba da **kod** (npr. `damijan01`) bude **isti** kao u tvojoj tabeli `AFFILIATE_PARTNERI` i kao vrednost koju upisuješ u custom field **Affiliate Code** na kontaktu kada lead dođe sa tim ref-om.  
3. Prilikom kreiranja affiliate-a u GHL-u unesi u polje za “affiliate code” ili “referral code” **tačno** taj kod (npr. `damijan01`) – bez razmaka, malim slovima, kao na sajtu.  
4. Ako GHL u pravilima programa nudi opciju tipa “Use contact custom field for attribution” ili “Affiliate code from contact field”, uključi je i izaberi polje **Affiliate Code** – tada će GHL za konverzije koristiti taj kod sa kontakta (što se poklapa sa onim što šalješ u `/api/affiliate/conversion`).

Čak i ako GHL ne povuče sve automatski iz tog polja, i dalje možeš:

- ručno validirati konverzije u GHL-u,  
- koristiti portal samo kao prikaz linkova i osnovnih brojki,  
- a **glavnu evidenciju i isplate** voditi u Google Sheet tab **Conversions** (AFFILIATE_KONVERZIJE).

### 9.4. Kako affiliate prati svoj dashboard na telefonu (što jednostavnije)

Kada je modul uključen i affiliate je dodat:

1. U GHL-u u **Affiliate Manager** otvori listu affiliate-a i izaberi konkretnog (npr. Damijan).  
2. Nađi opciju tipa **Invite**, **Send login link**, **Portal URL** ili **Copy link** – zavisno od verzije.  
3. **Invite:** ako postoji “Send invite”, GHL pošalje email sa linkom za registraciju/ulogovanje.  
   **Ili** kopiraj **portal URL** (link ka affiliate dashboard-u) i pošalji ga ručno (WhatsApp, email, SMS).  
4. Affiliate na telefonu:  
   - otvori link u **browseru** (Chrome, Safari, itd.),  
   - uloguje se (ako traži email/lozinku) ili odmah vidi dashboard ako je link jednokratni login,  
   - vidi svoje linkove, broj klikova, leadova, konverzija i proviziju – u okviru onoga što GHL prikazuje.

Za njih je iskustvo: “dobiješ link, otvoriš u browseru, uloguješ se, vidiš brojke” – bez posebne aplikacije.

### 9.5. Kako se ovo uklapa sa našim 2 tabele (Leads + Conversions)

Čak i kada koristiš GHL Affiliate Portal, **i dalje je pametno** da zadržiš svoje Sheet-e:

- **Leads** (AFFILIATE_LEADOVI) – tvoja interna evidencija ko je doveo koga,  
- **Conversions** (AFFILIATE_KONVERZIJE) – tvoja interna evidencija kupovina i provizija.

Razlozi:

- **Potpuna kontrola** nad podacima i strukturom; ne zavisiš isključivo od GHL prikaza.  
- Lakše praviš **sopstvene izveštaje** (filteri, SUM, export u PDF za isplatu).  
- Ako ikad promeniš CRM ili plan, **podaci ostaju kod tebe** u Sheet-u.

GHL portal je onda **prijatan prikaz za affiliate-a** (dashboard na telefonu), dok su tvoje tabele **glavna knjigovodstvena istina** za isplate i analizu.

---

## 10. Kada ti je dovoljan samo GHL, a kada poseban program

**Dovoljan ti je GHL + ova 2 Sheeta** ako:

- imaš do nekih 20–50 affiliate-a,  
- ok ti je da ti ili asistent ručno upisujete kupovine u `AFFILIATE_KONVERZIJE`,  
- ne treba ti da se affiliate uloguje i sam vidi dashboard (možeš mu ti poslati izveštaj).

**Treba ti poseban affiliate program (Tapfiliate, FirstPromoter, itd.)** tek kada:

- želiš da svaki affiliate ima **svoj login i portal**,  
- hoćeš da **automatizuješ isplate** (PayPal, Stripe Payouts…),  
- imaš veliki broj affiliate-a i ne želiš da se iko od vas bavi Excelima.

Za sada, za ovaj projekat, **najjednostavniji i najkontrolisaniji** pristup je:

- GHL kao **glavni CRM** (kontakt + `Affiliate Code`),  
- dva Google Sheeta:  
  - `AFFILIATE_LEADOVI` – koliko ljudi su doveli,  
  - `AFFILIATE_KONVERZIJE` – koliko je ljudi kupilo/prijavilo se + provizije,  
- **GHL Affiliate Portal** (ako ga tvoj plan ima) kao **front za affiliate-e** da na telefonu vide svoje brojke.

---

## 11. Rezime za potpunog početnika (checklista)

Ako ništa ne znaš, samo prati ovaj spisak redom.

Legenda:
- ✅ = urađeno u ovom projektu  
- ⬜ = još treba da uradiš

1. ✅ **Napravi listu affiliate-a**  
   - U Google Sheet napravi tabelu `AFFILIATE_PARTNERI`.  
   - Dodaj kolone: `affiliate_ime`, `affiliate_kod`, `kanal`.  
   - Smisli i upiši unikatne kodove (npr. `damijan01` za Damijana).

2. ✅ **Definiši affiliate linkove**  
   - Format: `https://tvoj-domen.com/?ref=affiliate_kod`.  
   - Za Damijana: `https://tvoj-domen.com/?ref=damijan01` (i `/ref/damijan01` radi).

3. ✅ **Sajt + backend**  
   - Čuva `ref` u cookie (`af_ref`) i generiše `affiliate_code`.  
   - Pri submitu forme šalje `affiliate_code` ka `/api/leads` i GHL webhook-u.

4. ⬜ **U GHL napravi custom field `Affiliate Code`**  
   - `Settings → Custom Fields → Add Field → Text`.  
   - Nazovi ga `Affiliate Code` (ili `affiliate_code`, ali koristi isto ime svuda).

5. ⬜ **U GHL workflow-u mapiraj polje**  
   - U workflowu koji se trigeruje za nove leadove:  
   - dodaj akciju **Update Contact**,  
   - podesi da `Affiliate Code` = vrednost polja `affiliate_code` iz webhooka/forme.

6. ⬜ **Napravi Sheet za LEADOVE (`AFFILIATE_LEADOVI`)**  
   - Dodaj kolone: `date`, `email`, `phone`, `source_tag`, `utm_source`, `utm_medium`, `utm_campaign`, `affiliate_code`.  
   - U Vercel-u podesi `LEADS_SHEET_ID` i `GOOGLE_SERVICE_ACCOUNT_JSON` da bi `/api/leads` automatski upisivao redove.

7. ⬜ **Napravi Sheet za KONVERZIJE (`AFFILIATE_KONVERZIJE`)**  
   - Dodaj tab `Conversions` sa kolonama: `created_at`, `email`, `phone`, `affiliate_code`, `order_amount`, `currency`, `order_id`, `conversion_type`, `commission_rate`, `commission_amount`, `status`.  
   - U Vercel-u podesi `AFFILIATE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON` i (opciono) `AFFILIATE_SHEET_CONVERSIONS_NAME=Conversions`.

8. ⬜ **Napravi GHL workflow za konverzije → `/api/affiliate/conversion`**  
   - U pipeline-u za prodaju, na status “Kupio” dodaj akciju **Webhook**.  
   - URL: `/api/affiliate/conversion` (tvoj produkcioni domen).  
   - Pošalji JSON sa: `email`, `phone`, `affiliate_code`, `orderAmount`, `currency`, `orderId`, `conversionType`.

9. ⬜ **Uključi i podesi Affiliate Manager u GHL-u**  
   - `Marketing → Affiliate Manager` → kreiraj kampanju i default proviziju.  
   - Dodaj Damijana kao affiliate-a sa kodom `damijan01`.  
   - Pošalji mu invite / portal link da može da prati dashboard sa telefona.

10. ⬜ **Jednom mesečno (ili češće) uradi interni izveštaj**  
   - U tabu **Leads** (Affiliate Sheet) ili u **Leads by Source** (LEADS_SHEET) filtriraj `affiliate_code` po partneru → koliko je leadova doneo.  
   - U tabu **Conversions** (Affiliate Sheet) filtriraj isti `affiliate_code` → koliko je kupaca i kolika je ukupna provizija (zbir `commission_amount`).  
   - Po tome radiš isplate i, po želji, šalješ im PDF/CSV izveštaj pored onoga što vide u GHL portalu.

---

## 12. Rešavanje problema (troubleshooting)

### Sheet se ne puni (Leads, Clicks, Conversions)

- **Proveri env u Vercel-u:** `LEADS_SHEET_ID` ili `AFFILIATE_SHEET_ID` (bez razmaka, samo ID iz URL-a), i `GOOGLE_SERVICE_ACCOUNT_JSON` (ceo JSON). Nakon izmene env, **Redeploy** projekta.
- **Deljenje Sheet-a:** Otvori Google Sheet → Share → dodaj email iz Service Account JSON-a (`client_email`) sa pravom **Editor**. Bez toga API nema pristup.
- **Imena tabova:** Podrazumevano Clicks, Leads, Conversions. Ako si tab nazvao drugačije, podesi `AFFILIATE_SHEET_CLICKS_NAME`, `AFFILIATE_SHEET_LEADS_NAME`, `AFFILIATE_SHEET_CONVERSIONS_NAME`. Za LEADS_SHEET: `LEADS_SHEET_NAME` ako ne koristiš prvi tab.
- **Na Vercel-u:** Na serverless funkciji, ako vratiš odgovor pre nego što se Sheet upis završi, upis se može prekinuti. U ovom projektu upisi u Sheet se **čekaju** (await) pre vraćanja odgovora, tako da bi trebalo da rade. Ako i dalje ne radi, pogledaj **Vercel → Project → Logs** (Functions) za grešku tipa "Leads Sheet append error" ili "Affiliate Sheet ... error".

### Konverzija se ne pripisuje / ne pojavljuje u Conversions tabu

- **affiliate_code u webhook-u:** GHL mora da šalje `affiliate_code` u body-ju (npr. `{{contact.affiliate_code}}` ili custom field **Affiliate Code**). Ako je prazan, endpoint vraća `attributed: false` i ne upisuje red.
- **orderAmount:** Mora biti broj veći od 0. Proveri da u GHL webhook body-ju šalješ `orderAmount` ili `order_amount` (broj, ne string).
- **Affiliate u bazi:** U Supabase tabeli `affiliates` mora postojati red sa tim `affiliate_code` i `status = 'active'`. Ako je affiliate registrovan preko sajta, već bi trebalo da postoji; inače dodaj ga ručno u Supabase ili preko `/api/affiliate/register`.

### U GHL-u kontakt nema Affiliate Code

- Workflow koji prima nove leadove mora da ima akciju **Update Contact** i da u polje **Affiliate Code** mapira vrednost iz webhooka (npr. `affiliate_code` iz inbound webhooka). Proveri da je trigger tog workflow-a zapravo “kad stigne webhook” ili “kad se kreira kontakt” kako šalje tvoj sajt.
- Na sajtu, forma mora da šalje `affiliate_code` u payload ka `/api/leads`; backend onda šalje taj payload i ka GHL webhook-u. Ako cookie `af_ref` nije setovan (korisnik nije došao preko `?ref=...`), `affiliate_code` će biti prazan i u GHL će ostati prazno.

### Rate limit (429 Too many requests)

- `/api/leads`: max 20 zahteva u 1 minuti po IP.  
- `/api/affiliate/track`: max 60 zahteva u 1 minuti po IP.  
Ako praviš testove, sačekaj minutu ili testiraj sa druge IP adrese.

---

## 13. Kompletan setup od nule (jedna stranica)

Ako već imaš sajt i repozitorijum, redosled je ovaj:

1. **Supabase:** Kreiraj projekat, uradi tabele (leads, affiliates, affiliate_clicks, affiliate_conversions) prema `SUPABASE_SCHEMA.txt`, isključi RLS. Uzmi URL i Service Role Key.
2. **Google:** Kreiraj Service Account (JSON key). Dva spreadsheet-a: (A) Leads by Source – jedan tab, kolone kao u 0.6; (B) Affiliate Sheet – tabovi Clicks, Leads, Conversions, kolone kao u 0.6. Share oba sa service account email-om (Editor).
3. **Vercel:** Dodaj sve env varijable iz sekcije 0.4 (Supabase, GHL_WEBHOOK_URL, LEADS_SHEET_ID, AFFILIATE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON). Redeploy.
4. **GHL:** Custom field **Affiliate Code** (Text). Workflow za nove leadove: trigger (npr. webhook ili Contact Created), akcija Update Contact → Affiliate Code = vrednost iz webhooka. Workflow za konverzije: trigger na status “Kupio”, akcija Webhook → POST na `https://tvoj-domen.com/api/affiliate/conversion`, body JSON sa email, phone, affiliate_code, orderAmount, currency, orderId, conversionType.
5. **Affiliate u bazi:** Registruj prvog affiliate-a (npr. preko `/api/affiliate/register` ili ručno u Supabase) sa `affiliate_code = damijan01` i željenim `commission_rate` (npr. 30).
6. **Test:** Otvori `https://tvoj-domen.com/?ref=damijan01`, popuni formu → proveri LEADS_SHEET i Affiliate Sheet tab Leads; u GHL-u proveri kontakt i polje Affiliate Code. Zatim u GHL-u simuliraj kupovinu (opportunity u status Kupio + webhook) → proveri tab Conversions.

Ovim je ceo sistem definisan od arhitekture do najsitnijeg detalja. Za pojedinačne korake koristi odgovarajuće sekcije (1–11) i tabelu env varijabli (0.4) i kolona (0.6).
