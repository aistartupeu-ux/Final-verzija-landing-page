# Leads by Source — KOMPLETAN SETUP od nule

Korak po korak: šta je urađeno u kodu i šta TI treba da uradiš.

---

## ŠTA JE URAĐENO U KODU (već spremno)

- UTM parametri se čuvaju u cookie kad posetilac uđe (facebook, instagram, affiliate ref)
- Svi leadovi šalju `source_tag`, UTM i `affiliate_code` u API
- **Dva načina** upisa u Sheet:
  1. **Make webhook** (ako je `LEADS_SOURCE_WEBHOOK_URL` podešena)
  2. **Direktno u Google Sheet** (ako su `LEADS_SHEET_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON` podešeni) — radi bez Make

---

## TVOJ DEO — KORAK PO KORAK

### KORAK 1: Google Sheet (2 min)

1. Otvori [Google Sheets](https://sheets.google.com) i kreiraj novi spreadsheet
2. Nazovi ga npr. **"Leads by Source"**
3. U **prvi red (1)** upiši zaglavlja:

   | A1 | B1 | C1 | D1 | E1 | F1 | G1 | H1 | I1 |
   |----|----|----|----|----|----|----|----|----|
   | date | email | phone | name | source_tag | utm_source | utm_medium | utm_campaign | affiliate_code |

4. Ostavi red 2 i dalje prazne
5. Sačuvaj (Ctrl+S)

---

### KORAK 2: Make.com — povezivanje Google naloga (2 min)

1. Otvori [make.com](https://make.com) i prijavi se
2. Gore desno: klikni na avatar → **Data Stores** ili **Connections**
3. **Connections** → **Add** → pretraži **Google Sheets**
4. Klikni **Create** → prijavi se na Google i dozvoli pristup
5. Kada vidiš zelenu kvačicu — povezivanje je gotovo

---

### KORAK 3: Make.com — kreiranje scenarija (5 min)

1. U Make: **Scenarios** → **Create a new scenario**
2. Klikni na veliko **+** u centru

#### 3a. Webhook modul (trigger)

3. Pretraži: **Webhooks**
4. Izaberi **Custom webhook**
5. Klikni **Add** — Make kreira webhook
6. Kopiraj **Webhook URL** (npr. `https://hook.eu2.make.com/xxxxxxxx`) — trebaće ti za Vercel
7. Proširi **Show advanced settings** (ako postoji)
8. Nađi **Data structure** → klikni **Add**
9. Izaberi **JSON**
10. U polje zalepi tačno ovo:
    ```json
    {"date":"","email":"","phone":"","name":"","source_tag":"","utm_source":"","utm_medium":"","utm_campaign":"","affiliate_code":""}
    ```
11. Klikni **OK**
12. Klikni **OK** na Webhook modulu

#### 3b. Google Sheets modul (akcija)

13. Klikni **+** ISPOD Webhook modula (ne pored)
14. Pretraži: **Google Sheets**
15. Izaberi **Add a row**
16. **Connection:** izaberi tvoj Google nalog
17. **Spreadsheet:** izaberi "Leads by Source" (tvoj Sheet)
18. **Sheet name:** obično "Sheet1" ili ime prvog lista
19. **Values** — klikni **Add item** 9 puta i popuni:

    | # | Column | Value (klikni u polje pa iz Mapping panela izaberi iz Webhook [1]) |
    |---|--------|-------------------------------------------------------------------|
    | 1 | A | `{{1.date}}` |
    | 2 | B | `{{1.email}}` |
    | 3 | C | `{{1.phone}}` |
    | 4 | D | `{{1.name}}` |
    | 5 | E | `{{1.source_tag}}` |
    | 6 | F | `{{1.utm_source}}` |
    | 7 | G | `{{1.utm_medium}}` |
    | 8 | H | `{{1.utm_campaign}}` |
    | 9 | I | `{{1.affiliate_code}}` |

20. Klikni **OK**
21. **Save** scenario (Ctrl+S)
22. **Toggle ON** (donje desno) da scenario radi

---

### KORAK 4: Vercel — env varijabla (2 min)

1. Otvori [vercel.com](https://vercel.com) → tvoj projekat
2. **Settings** → **Environment Variables**
3. **Add New**
   - **Name:** `LEADS_SOURCE_WEBHOOK_URL`
   - **Value:** URL iz Make (Korak 3, tačka 6)
   - **Environment:** označi **Production** (i Preview ako želiš)
4. Klikni **Save**

---

### KORAK 5: Deploy sajta

1. Uradi **git push** da se najnoviji kod deployuje na Vercel  
   — ili u Vercel Dashboard: **Deployments** → **Redeploy** poslednjeg deploya
2. Sačekaj da deploy završi (zelena kvačica)

---

### KORAK 6: Test (3 min)

1. Otvori svoj live sajt
2. Unesi email u formu (Hero ili bilo gde gde je EmailForm) i submituj
3. U Make: **Scenarios** → tvoj scenario → **History**
   - Trebalo bi da vidiš novi run (zeleni krug)
4. U Google Sheet-u — u drugom redu trebalo bi da se pojavi novi lead sa datom, emailom, source_tag: direct itd.

**Ako ne radi:**
- Proveri Make History — da li se scenario uopšte pokreće? Ako NE → problem u Vercel env ili deploy
- Ako se scenario pokreće ali Sheet je prazan → vidi **FIX ISPOD**

---

## FIX: Scenario radi ali se NIŠTA NE UPISUJE u Sheet

Make prima podatke, ali Google Sheets modul ne dobija ispravno mapiranje. Probaj ovo:

### Rešenje A: Dodaj Parse JSON modul između Webhook i Google Sheets

1. U Make scenariju: **obriši** trenutnu vezu između Webhook i Google Sheets (klikni na liniju i Delete)
2. Klikni **+** ispod Webhook modula
3. Pretraži: **JSON**
4. Izaberi **Parse JSON**
5. U polje **JSON string** klikni i iz Mapping panela probaj **jednu** od ovih vrednosti:
   - `{{1.body}}` — ako webhook stavlja body u `body`
   - `{{1}}` — ako je ceo output string
   - `{{toString(1)}}` — alternativno
6. Klikni **OK** — Parse JSON je sada modul **[2]**
7. Klikni **+** ispod Parse JSON modula
8. Dodaj ponovo **Google Sheets → Add a row**
9. U **Values** mapiraj iz modula **[2]** (Parse JSON):
   - A → `{{2.date}}`  B → `{{2.email}}`  C → `{{2.phone}}`
   - D → `{{2.name}}`  E → `{{2.source_tag}}`  F → `{{2.utm_source}}`
   - G → `{{2.utm_medium}}`  H → `{{2.utm_campaign}}`  I → `{{2.affiliate_code}}`
10. Save, Toggle ON, test ponovo

### Rešenje B: Probaj `1.body.xxx` umesto `1.xxx`

Ako ne želiš Parse JSON, u Google Sheets modulu u Values zameni:
- `{{1.date}}` → `{{1.body.date}}`
- `{{1.email}}` → `{{1.body.email}}`
- itd. za sva polja

Save, test.

### Rešenje C: Proveri output Webhook modula

1. Make → Scenarios → tvoj scenario → **History**
2. Klikni na poslednji run (zeleni krug)
3. Klikni na **Webhook** modul
4. Pogledaj **Output** — koja je tačna putanja do `date` i `email`?
   - Ako vidiš `body` → `date`, `email`… → koristi `1.body.date`
   - Ako vidiš direktno `date`, `email` → trebalo bi `1.date`, proveri da li Google Sheets ima grešku (crveni X)
5. Ako Google Sheets modul ima **crveni X** — otvori ga, vidi error poruku (npr. permission, wrong sheet name)

---

## REZIME — šta treba da imaš

| Gde | Šta |
|-----|-----|
| Google Sheet | "Leads by Source" sa zaglavljima u prvom redu |
| Make.com | Scenario: Webhook (sa Data structure) → Google Sheets Add a row, Toggle ON |
| Vercel | `LEADS_SOURCE_WEBHOOK_URL` = Make webhook URL |
| Vercel | Poslednji deploy (git push ili Redeploy) |

---

## Redosled radnji (Make)

1. Google Sheet  
2. Make (connections + scenario + Data structure + Values)  
3. Vercel env (`LEADS_SOURCE_WEBHOOK_URL`)  
4. Deploy  
5. Test  

---

## ALTERNATIVA: Direktan upis BEZ Make (kad Make ne radi)

Ako Make i dalje ne upisuje u Sheet, koristi direktan Google Sheets API.

### Korak 1: Google Cloud — Service Account

1. Otvori [Google Cloud Console](https://console.cloud.google.com)
2. Kreiraj projekat (ili izaberi postojeći)
3. **APIs & Services** → **Library** → pretraži **Google Sheets API** → **Enable**
4. **APIs & Services** → **Credentials** → **Create Credentials** → **Service account**
5. Unesi ime (npr. "Leads Sheet"), klikni **Create**
6. Role: **Editor** (ili ostavi prazno), **Done**
7. Klikni na kreirani service account
8. **Keys** tab → **Add key** → **Create new key** → **JSON** → Download
9. Otvori JSON fajl — trebaće ti `client_email` i `private_key`

### Korak 2: Podeli Sheet sa service account-om

1. Otvori svoj Google Sheet "Leads by Source"
2. Klikni **Share**
3. U polje za email unesi `client_email` iz JSON-a (npr. `leads-sheet@project.iam.gserviceaccount.com`)
4. Pristup: **Editor**
5. Klikni **Send**

### Korak 3: Vercel env

1. **LEADS_SHEET_ID** — iz URL-a Sheet-a:  
   `https://docs.google.com/spreadsheets/d/OVDE_ID_ID_ID_ID_ID/edit`  
   Kopiraj deo između `/d/` i `/edit`
2. **GOOGLE_SERVICE_ACCOUNT_JSON** — otvori JSON fajl, kopiraj CELU sadržinu (od `{` do `}`) i zalepi kao vrednost
   - U Vercel: **Value** polje — zalepi ceo JSON u jednom redu (može biti dugačak)
   - Ako ne radi: minifikuj JSON (ukloni sve prelome redova) pre zalepke
   - Opciono: **LEADS_SHEET_NAME** = ime lista ako nije "Sheet1"

### Korak 4: Deploy

Redeploy aplikacije da učita nove env varijable.

### Korak 5: Test

Submituj formu — red bi trebalo da se odmah pojavi u Sheet-u. Nema Make-a, sve radi direktno iz API-ja.

### Ne upisuje? Troubleshooting direktnog Sheet-a

0. **Brza provera** — otvori `https://tvoj-domen.com/api/leads/sheet-status` u browseru. Vraća da li je konfiguracija OK ili šta nedostaje.
1. **Proveri Vercel env** — da li su `LEADS_SHEET_ID` i `GOOGLE_SERVICE_ACCOUNT_JSON` zaista dodati? Redeploy nakon dodavanja.
2. **Vercel Logs** — Deployments → poslednji deploy → **Functions** → otvori `/api/leads` → **Logs**. Traži "Leads Sheet" poruke:
   - "LEADS_SHEET_ID env nije postavljen" → dodaj env
   - "GOOGLE_SERVICE_ACCOUNT_JSON env nije postavljen" → dodaj env
   - "missing client_email or private_key" → JSON nije validan, proveri da si kopirao ceo fajl
   - "Leads Sheet append error: ..." → vidi tačnu grešku ispod
3. **403 / Permission denied** → Sheet nije share-ovan sa `client_email` iz JSON-a. Share → unesi taj email → Editor.
4. **404 / Not found** → pogrešan `LEADS_SHEET_ID`. Kopiraj iz URL-a između `/d/` i `/edit`.
5. **Sheet name** → ako prvi tab nije "Sheet1", dodaj env `LEADS_SHEET_NAME` = tačan naziv (npr. "Leads by Source").
