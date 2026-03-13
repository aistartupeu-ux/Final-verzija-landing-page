# Leads by Source — Google Sheet: detaljan korak-po-korak vodič

Sve što treba da uradiš da bi leadovi iz sajta automatski upisivali u tvoj Google Sheet. Sheet može da bude na tvom ličnom Gmail-u.

---

## Deo 1: Google Cloud — Service Account

Service account je „robot” nalog koji će sajt koristiti da piše u tvoj Sheet. Ne koristi tvoj lični Google nalog.

### 1.1 Otvori Google Cloud Console

1. U browseru otvori: **https://console.cloud.google.com**
2. Prijavi se na Google nalog (isti na kom imaš Sheet).

### 1.2 Kreiraj ili izaberi projekat

1. Gore na stranici vidiš **Select a project** (ili ime projekta).
2. Klikni na to.
3. Ako već imaš projekat — izaberi ga i pređi na **1.3**.
4. Ako nemaš:
   - Klikni **NEW PROJECT**
   - **Project name:** npr. „Leads Sheet” ili „AI Hype”
   - Klikni **CREATE**
   - Sačekaj par sekundi, pa izaberi taj projekat.

### 1.3 Uključi Google Sheets API

1. U levom meniju: **APIs & Services** → **Library** (ili **Enabled APIs & services** → **+ ENABLE APIS AND SERVICES**).
2. U pretrazi unesi: **Google Sheets API**.
3. Klikni na **Google Sheets API**.
4. Klikni dugme **ENABLE**.
5. Sačekaj da se uključi (poruka „API enabled”).

### 1.4 Kreiraj Service Account

1. U levom meniju: **APIs & Services** → **Credentials**.
2. Gore klikni **+ CREATE CREDENTIALS**.
3. Iz padajuće liste izaberi **Service account**.
4. **Service account name:** npr. „leads-sheet” (može bilo šta).
5. **Service account ID** se popuni sam — ostavi.
6. Klikni **CREATE AND CONTINUE**.
7. **Grant access** (opciono) — možeš preskočiti: klikni **CONTINUE**.
8. **Grant users access** — preskoči: klikni **DONE**.

### 1.5 Preuzmi JSON ključ

1. Na stranici **Credentials** u listi vidiš **Service Accounts**. Klikni na email koji si upravo kreirao (npr. `leads-sheet@...iam.gserviceaccount.com`).
2. Otvoriće se stranica tog service account-a.
3. Gore izaberi tab **KEYS**.
4. Klikni **ADD KEY** → **Create new key**.
5. Izaberi **JSON**.
6. Klikni **CREATE**.
7. Preuzme se JSON fajl (npr. `projekat-xxxxx.json`). **Sačuvaj ga negde i ne deli ga** — to je tajna.

### 1.6 Nađi email u JSON fajlu

1. Otvori preuzeti JSON fajl u Notepad-u ili drugom editoru.
2. Nađi red koji izgleda ovako:  
   `"client_email": "nešto@nešto.iam.gserviceaccount.com"`
3. **Kopiraj taj ceo email** (bez navodnika). Trebaće ti u **Deo 2** za Share.

---

## Deo 2: Podeli Google Sheet sa Service Account-om

Sheet može da bude na tvom ličnom Gmail-u. Jedino što treba je da ga „podeliš” sa email-om iz koraka 1.6.

### 2.1 Otvori Sheet

1. Otvori svoj Google Sheet **„Leads by Source”** (onaj na tvom email-u).
2. Proveri da u prvom redu imaš zaglavlja:  
   `date` | `email` | `phone` | `name` | `source_tag` | `utm_source` | `utm_medium` | `utm_campaign` | `affiliate_code`

### 2.2 Otvori Share

1. Gore desno u Sheet-u klikni dugme **Share** (ili **Podeli**).
2. Otvoriće se prozor za deljenje.

### 2.3 Dodaj Service Account email

1. U polju **Add people and groups** (ili „Dodaj korisnike”) nalepi **email koji si kopirao iz JSON-a** (iz 1.6).
2. Pored njega iz padajuće liste izaberi **Editor** (ne Viewer).
3. **Isplati se ukloniti kvačicu** za „Notify people” (da ne šalje mail robotu).
4. Klikni **Share** (ili **Send**).

Sada taj „robot” (service account) ima dozvolu da piše u tvoj Sheet.

---

## Deo 3: Vercel — env varijable

### 3.1 LEADS_SHEET_ID

1. Ostani u tom istom Google Sheet-u.
2. Pogledaj URL u adresnoj traci. Izgleda otprilike ovako:  
   `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
3. **Kopiraj samo deo između** `/d/` **i** `/edit`.  
   U primeru iznad to je: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`  
   (tvoj će biti drugačiji — samo taj deo, bez razmaka.)

### 3.2 GOOGLE_SERVICE_ACCOUNT_JSON — priprema

1. Otvori ponovo preuzeti JSON fajl iz 1.5.
2. Treba da zalepiš **celu sadržinu** u Vercel. Da ne bi bilo problema sa redovima:
   - Otvori npr. **https://www.jsonformatter.io** ili **https://jsonformatter.org**
   - U polje zalepi **ceo** sadržaj JSON fajla (Ctrl+A u fajlu, Ctrl+C, pa Ctrl+V u sajt).
   - Klikni **Minify** ili **Compress** (ili slično).
   - Rezultat je jedan dugačak red. **Kopiraj ceo taj red** (Ctrl+A u rezultatu, Ctrl+C).

### 3.3 Dodavanje u Vercel

1. Otvori **https://vercel.com** i prijavi se.
2. Izaberi projekat (tvoj AI Hype Academy sajt).
3. Gore: **Settings** → **Environment Variables**.
4. **Add New** (ili **Add**).

**Prva varijabla:**

- **Key (Name):** `LEADS_SHEET_ID`
- **Value:** nalepi ID koji si kopirao u 3.1 (samo ID, bez razmaka).
- **Environments:** označi **Production**. Ako koristiš i Preview, označi i to.
- Klikni **Save**.

**Druga varijabla:**

- Klikni opet **Add New**.
- **Key (Name):** `GOOGLE_SERVICE_ACCOUNT_JSON`
- **Value:** nalepi **ceo** minifikovani JSON (onaj jedan dugačak red iz 3.2). Ne dodavaj navodnike oko njega.
- **Environments:** Production (i Preview ako želiš).
- Klikni **Save**.

### 3.4 Opciono — drugačiji naziv lista

**Ovo više nije obavezno** — kod automatski uzima ime prvog taba („Sheet1”, „Lista 1” itd.). Ako želiš da koristi drugi tab:

- **Key:** `LEADS_SHEET_NAME`
- **Value:** tačan naziv taba (npr. `Leads by Source`).

---

## Deo 4: Redeploy i provera

### 4.1 Redeploy

1. U Vercel-u: **Deployments**.
2. Kod poslednjeg deploya klikni na **⋯** (tri tačkice).
3. Izaberi **Redeploy**.
4. Potvrdi i sačekaj da deploy uspe (zelena kvačica).

### 4.2 Provera konfiguracije

1. U browseru otvori:  
   `https://TVOJ-DOMEN.com/api/leads/sheet-status`  
   (zameni TVOJ-DOMEN sa pravim domenom.)
2. Trebalo bi da vidiš nešto kao:  
   `{"configured":true,"sheetId":"...","clientEmail":"...@....iam.gserviceaccount.com"}`
3. Ako piše `"configured": false` i `"reason": "..."` — vrati se na korak koji ta poruka pominje (npr. nedostaje LEADS_SHEET_ID ili GOOGLE_SERVICE_ACCOUNT_JSON).

### 4.3 Test upisa

1. Otvori svoj sajt (početnu stranicu).
2. Unesi email u formu (Hero / CTA) i pošalji.
3. Otvori ponovo Google Sheet „Leads by Source”.
4. U **drugom redu** (ispod zaglavlja) trebalo bi da se pojavi novi red sa datom, emailom, source_tag itd.

---

## Rezime redosleda

1. Google Cloud: projekat → Sheets API → Service account → Keys → Download JSON.
2. U JSON-u naći `client_email` i kopirati ga.
3. Google Sheet: Share → uneti taj email → Editor.
4. Iz URL-a Sheet-a kopirati LEADS_SHEET_ID.
5. JSON minifikovati i u Vercel dodati LEADS_SHEET_ID i GOOGLE_SERVICE_ACCOUNT_JSON.
6. Redeploy → provera `/api/leads/sheet-status` → test forme.

Ako nešto od ovoga ne radi, napiši tačno na kom koraku si i šta vidiš (npr. poruka greške ili screenshot).
