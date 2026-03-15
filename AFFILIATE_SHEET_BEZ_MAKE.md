# Affiliate Sheet — kompletno uputstvo (bez Make)

Ovaj dokument je **samo za ovaj sistem**: jedan Google Sheet u koji idu **isključivo** affiliate klikovi i affiliate leadovi. Ništa drugo (direct leadovi, drugi izvori) ne upisuje se u ovaj Sheet. Detaljno je opisano šta je urađeno u kodu i **tačno šta ti treba da uradiš** da sve radi bez grešaka.

---

# DEO A — Šta je urađeno u kodu (da razumeš sistem)

## A1. Novi fajlovi i izmene

### 1. `lib/affiliate-sheet.ts` (nov)
- **Namena:** Direktan upis u Google Sheet preko Google Sheets API-ja (bez Make).
- **Šta radi:** Dve funkcije:
  - `appendAffiliateClickToSheet(row)` — dodaje jedan red u tab **Clicks** (clicked_at, affiliate_code, visitor_id, page_url, utm_source, utm_campaign).
  - `appendAffiliateLeadToSheet(row)` — dodaje jedan red u tab **Leads** (created_at, email, phone, affiliate_code, visitor_id, page_url, utm_source, utm_campaign, status).
- **Autentifikacija:** Koristi env varijable `GOOGLE_SERVICE_ACCOUNT_JSON` i `AFFILIATE_SHEET_ID`. Ako tab "Clicks" ili "Leads" ne postoji u spreadsheet-u, kod ih automatski kreira pri prvom upisu.
- **Važno:** Ovaj modul piše **samo** u spreadsheet čiji je ID u `AFFILIATE_SHEET_ID`. Ne diše drugi Sheet (npr. LEADS_SHEET_ID).

### 2. `app/api/affiliate/track/route.ts` (izmenjen)
- **Ranije:** Zahtevao je `MAKE_WEBHOOK_URL`; bez njega je vraćao grešku 503.
- **Sada:**
  - Radi ako je podešen **bilo** `MAKE_WEBHOOK_URL` **bilo** Affiliate Sheet (`AFFILIATE_SHEET_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON`).
  - Za **click:** upisuje u Supabase `affiliate_clicks` (za dashboard), opciono šalje na Make (ako je URL postavljen), i **ako je AFFILIATE_SHEET_ID postavljen** — poziva `appendAffiliateClickToSheet` i upisuje red u tab Clicks.
  - Za **lead:** isto — opciono Make, i ako je Sheet podešen upisuje red u tab Leads preko `appendAffiliateLeadToSheet`.
- **Greška 503** se javlja samo ako **nijedno** nije podešeno (ni Make ni Affiliate Sheet).

### 3. `app/api/affiliate/sheet-status/route.ts` (nov)
- **Namena:** Provera da li je Affiliate Sheet ispravno podešen.
- **URL:** `GET https://tvoj-domen.com/api/affiliate/sheet-status`
- **Odgovor:** JSON sa `configured: true/false`, razlog ako nije (npr. nedostaje AFFILIATE_SHEET_ID ili GOOGLE_SERVICE_ACCOUNT_JSON), i nazivi tabova (clicksTab, leadsTab).

---

## A2. Tok podataka (da ne ode negde drugde)

- **Ovaj Affiliate Sheet** prima podatke **samo** iz `/api/affiliate/track`:
  - kada neko uđe preko linka sa `?ref=CODE` ili `/ref/CODE` → upisuje se **click** u tab Clicks;
  - kada isti posetilac (sa cookie `af_ref`) submituje formu → sajt šalje **lead** na `/api/affiliate/track` → upisuje se red u tab Leads.
- **Ostali leadovi** (bez ref linka) idu u `/api/leads` → GHL i eventualno u drugi Sheet (Leads by Source / LEADS_SHEET_ID). **Ne idu** u Affiliate Sheet.
- **Zaključak:** Ovaj fajl (ovaj Sheet) je za sebe — samo affiliate klikovi i affiliate leadovi; ništa drugo se ovde ne upisuje iz koda.

---

# DEO B — Šta ti treba da uradiš (korak po korak)

Slede koraci koje **moraš** da uradiš ručno. Ako preskočiš nešto, može doći do greške ili da podaci ne stignu u Sheet.

---

## B1. Google Sheet — kreiranje (samo za affiliate)

### B1.1 Kreiraj novi spreadsheet
1. Otvori [Google Sheets](https://sheets.google.com) i uloguj se.
2. Klikni **+ Blank** (ili **File → New → Spreadsheet**) da napraviš **potpuno nov** spreadsheet.
3. **Ne koristi** postojeći Sheet u koji već upisuješ druge leadove (npr. "Leads by Source"). Ovaj mora biti **poseban**, samo za affiliate.
4. Preimenuj spreadsheet: dvostruki klik na naslov "Untitled spreadsheet" na vrhu i unesi npr. **AHA_Affiliate_System** (ili bilo koji naziv — naziv ne utiče na rad; važan je samo ID u koraku B1.3).

### B1.2 Dodaj i preimenuj tabove
1. Na dnu spreadsheet-a vidiš tab(e). Podrazumevano je jedan tab (npr. "Sheet1").
2. **Prvi tab — Clicks:**
   - Desni klik na tab (npr. "Sheet1") → **Rename**.
   - Unesi tačno: **Clicks** (veliko C, ostalo malo). Bez razmaka ispred ili iza.
   - Ovaj tab će primati redove za svaki klik na affiliate link.
3. **Drugi tab — Leads:**
   - Klikni **+** pored taba "Clicks" (ili desni klik u prazan prostor do tabova → **Add sheet**).
   - Novi tab se pojavi. Preimenuj ga u tačno: **Leads** (veliko L).
   - Ovaj tab će primati redove za svaki lead (submit forme) sa affiliate linka.

**Provera:** Na dnu moraš imati dva taba: **Clicks** i **Leads**. Nazivi moraju biti tačno tako (ili ćeš kasnije u Vercel-u navesti druge nazive kroz env — vidi B3).

### B1.3 Kopiranje ID-a spreadsheet-a (obavezno)
1. Pogledaj adresnu traku u browseru. URL izgleda ovako:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
   ```
2. **ID** je deo između `/d/` i `/edit`. U primeru iznad to je: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`.
3. **Selektuj samo taj deo** (bez `/d/` i bez `/edit`), desni klik → **Copy** (ili Ctrl+C). Sačuvaj ga u Notepad — trebaće za Vercel u koraku B3.
4. **Greška koju treba izbeći:** Ne kopiraj ceo URL; ne kopiraj naziv fajla. Samo ID (niz slova i brojeva).

### B1.4 (Opciono) Header red u tabovima
- U tabu **Clicks** u prvi red možeš uneti naslove: `clicked_at` | `affiliate_code` | `visitor_id` | `page_url` | `utm_source` | `utm_campaign`. Kod dodaje redove **ispod** prvog reda, tako da ako ostaviš prazan prvi red, prvi upis će biti u redu 1; ako staviš header, upisi idu od reda 2. Ovo je samo radi čitljivosti.
- U tabu **Leads** isto: `created_at` | `email` | `phone` | `affiliate_code` | `visitor_id` | `page_url` | `utm_source` | `utm_campaign` | `status`.

---

## B2. Google Service Account (pristup za sajt da piše u Sheet)

Sajt piše u Sheet preko "Service Account" naloga — to je nalog bez lozinke, samo JSON fajl. Taj nalog mora imati **Editor** pristup na tvoj Affiliate Sheet.

### B2.1 Ako već imaš Service Account (npr. za drugi Sheet / leads)
1. Nađi JSON fajl koji si ranije preuzeo (ili otvori env varijablu **GOOGLE_SERVICE_ACCOUNT_JSON** u Vercel-u ako je već tamo).
2. Otvori JSON u editoru. Trebalo bi da vidiš polja kao: `"type": "service_account"`, `"project_id"`, `"private_key_id"`, `"private_key"`, `"client_email"`, itd.
3. **Kopiraj vrednost polja `client_email`.** Izgleda npr. ovako: `moj-projekat@moj-projekat-123456.iam.gserviceaccount.com`.
4. Otvori svoj **Affiliate Sheet** (AHA_Affiliate_System) u browseru.
5. Klikni **Share** (gore desno).
6. U polje "Add people and groups" **nalepi** taj `client_email` (samo email, bez navodnika).
7. Sa desne strane padajuće liste izaberi **Editor** (ne "Viewer").
8. **Isključi** opciju "Notify people" (nije potrebno da šalješ email tom nalogu).
9. Klikni **Share** ili **Send**.
10. **Ne kreiraj** novi Service Account; koristiš isti JSON i u Vercel-u za **GOOGLE_SERVICE_ACCOUNT_JSON** (vidi B3).

### B2.2 Ako nemaš Service Account (prvi put)
1. Otvori [Google Cloud Console](https://console.cloud.google.com) i uloguj se.
2. Izaberi projekat (ili kreiraj novi: **Select a project → New Project** — npr. "AI Hype Academy", pa **Create**).
3. U levom meniju: **APIs & Services** → **Credentials** (ili pretraži "Credentials" u search).
4. Na vrhu stranice klikni **+ Create Credentials** → **Service account**.
5. **Service account details:** Unesi npr. "affiliate-sheet" za Service account name. Klikni **Create and Continue**.
6. **Grant access** (opciono): možeš preskočiti — **Continue** → **Done**.
7. U listi Credentials nađi sekciju **Service Accounts**. Klikni na upravo kreirani nalog (email tipa `affiliate-sheet@...iam.gserviceaccount.com`).
8. Otvori tab **Keys**. Klikni **Add Key** → **Create new key** → izaberi **JSON** → **Create**. Preuzme se JSON fajl.
9. **Sačuvaj taj fajl na sigurno mesto.** Otvori ga u editoru i **kopiraj vrednost polja `client_email`** (ceo string u navodnicima).
10. U Google Sheet-u (tvoj Affiliate Sheet) → **Share** → u polje nalepi `client_email` → pristup **Editor** → **Share**.
11. **Omogući Google Sheets API:** U Cloud Console levo **APIs & Services** → **Library** → pretraži "Google Sheets API" → **Enable** ako nije već uključen.

---

## B3. Vercel — Environment Variables

Bez ovih vrednosti sajt **ne može** da piše u Affiliate Sheet. Koraci su namenjeni Vercel dashboardu.

### B3.1 Otvaranje podešavanja
1. Idi na [vercel.com](https://vercel.com), uloguj se.
2. Klikni na svoj **projekat** (AI Hype Academy / kako god se zove).
3. Gore u tabovima klikni **Settings**.
4. U levom sidebar-u klikni **Environment Variables**.

### B3.2 Dodavanje AFFILIATE_SHEET_ID
1. U polje **Key** unesi tačno (velika/mala slova i donja crta): **AFFILIATE_SHEET_ID**
2. U polje **Value** nalepi **samo ID** spreadsheet-a koji si kopirao u B1.3 (bez razmaka na početku/kraju, bez https://, bez /edit).
3. **Environments:** označi **Production** (i po želji **Preview** ako koristiš preview deploye).
4. Klikni **Save**.

**Česte greške:**  
- Uneti ceo URL umesto samo ID-a → neće raditi.  
- Dodati razmak na kraju vrednosti → može izazvati grešku.  
- Pogrešan Key (npr. AFFILIATE_SHEET_ID_ ili AFFILIATE_SHEET) → kod neće naći varijablu.

### B3.3 Dodavanje ili provera GOOGLE_SERVICE_ACCOUNT_JSON
1. Ako već postoji env **GOOGLE_SERVICE_ACCOUNT_JSON** (npr. za leads Sheet) — **ne dodaj drugi.** Samo proveri da je vrednost ceo JSON (počinje sa `{` i završava sa `}`).
2. Ako **ne postoji:** Klikni **Add New** (ili Add). Key: **GOOGLE_SERVICE_ACCOUNT_JSON**. U **Value** nalepi **ceo sadržaj** JSON fajla Service Account-a (jedan red ili više — Vercel prihvata). Mora biti validan JSON (sve u jednom bloku, bez brisanja zareza ili zagrada).
3. **Važno:** Ako Vercel "spoji" nove linije u jednu, u JSON-u se `\n` u `private_key` ponekad zameni; kod u `lib/affiliate-sheet.ts` već zamenjuje `\\n` sa pravim prelomom reda, tako da obično radi i kad se nalepi ceo JSON.
4. Označi **Production** (i Preview po želji) → **Save**.

**Ne deli** ovaj JSON ni sa kim i ne commituj ga u Git. Samo u Vercel env.

### B3.4 Opciono — drugačiji naziv tabova
Ako si tabove nazvao drugačije (npr. "Klikovi" i "Leadovi"):
- Key: **AFFILIATE_SHEET_CLICKS_NAME** → Value: **Klikovi**
- Key: **AFFILIATE_SHEET_LEADS_NAME** → Value: **Leadovi**

Ako su tabovi tačno **Clicks** i **Leads**, ove varijable **ne moraš** da dodaješ.

### B3.5 Make (ne obavezno)
- Ako **ne želiš** da koristiš Make za affiliate: **ne dodaj** `MAKE_WEBHOOK_URL` ili ga obriši ako postoji. Dovoljno je AFFILIATE_SHEET_ID + GOOGLE_SERVICE_ACCOUNT_JSON.
- Ako želiš i Make i Sheet: možeš ostaviti `MAKE_WEBHOOK_URL`; tada će se podaci slati i u Make i u ovaj Sheet.

### B3.6 Redeploy
1. Otvori tab **Deployments** u projektu.
2. Na vrhu liste nađi poslednji deployment.
3. Klikni tri tačkice **⋯** pored njega → **Redeploy**.
4. Potvrdi **Redeploy**. Sačekaj da se deploy završi (status "Ready").

Bez redeploy-a nove env varijable neće biti vidljive aplikaciji.

---

## B4. Supabase (da dashboard i klikovi budu po affiliate-u)

Affiliate **klikovi** se u Supabase upisuju u tabelu `affiliate_clicks`; **leadovi** se vezuju za kontakte u GHL. Da bi klikovi i statistika za affiliate-a radili, u Supabase mora postojati red u tabeli **affiliates** sa odgovarajućim `affiliate_code` i `status = active`.

### B4.1 Provera tabele affiliates
1. Otvori [Supabase](https://supabase.com) → svoj projekat.
2. Levo **Table Editor** → izaberi tabelu **affiliates**.
3. Proveri da postoje kolone tipa: `id`, `affiliate_code`, `name` ili `affiliate_name`, `status`, `email` (po potrebi). Ako tabela ne postoji, mora je kreirati neko ko ima pristup bazi (nije obuhvaćeno ovim koracima).

### B4.2 Dodavanje test affiliate-a (npr. za DAMIJAN123)
1. U **affiliates** klikni **Insert row** (ili Add row).
2. Popuni:
   - **affiliate_code:** tačno **DAMIJAN123** (ili drugi kod koji ćeš koristiti u linku; preporučeno velika slova).
   - **status:** **active**
   - **name** / **affiliate_name:** npr. **Damijan**
   - **email:** bilo koji validan email ako je kolona obavezna.
3. Sačuvaj. Bez ovog reda, klikovi će i dalje stizati u Affiliate Sheet (ako je Sheet podešen), ali u Supabase `affiliate_clicks` neće biti upisa za tog affiliate-a i dashboard neće prikazati njegove klikove.

---

## B5. Provera da ništa ne ode negde drugde i da sve radi

### B5.1 Status endpoint
1. Otvori u browseru (zameni domen svojim):  
   **https://tvoj-domen.com/api/affiliate/sheet-status**
2. Očekivano: JSON tipa:
   ```json
   {
     "configured": true,
     "sheetId": "1BxiMVs0...",
     "clientEmail": "xxx@xxx.iam.gserviceaccount.com",
     "clicksTab": "Clicks",
     "leadsTab": "Leads"
   }
   ```
3. Ako vidiš `"configured": false` i `"reason": "..."` — proveri:
   - **AFFILIATE_SHEET_ID** da je dodat i da je vrednost samo ID (bez URL-a).
   - **GOOGLE_SERVICE_ACCOUNT_JSON** da je ceo JSON i da u njemu ima `client_email` i `private_key`.
   - Da si uradio **Redeploy** posle dodavanja env.

### B5.2 Test klik
1. Otvori **Incognito** prozor (Ctrl+Shift+N u Chrome-u).
2. U adresnu traku unesi (zameni domen i kod):  
   **https://tvoj-domen.com/?ref=DAMIJAN123**  
   ili **https://tvoj-domen.com/ref/DAMIJAN123**
3. Stranica se učitava. Jedan put po sesiji sajt šalje "click" na `/api/affiliate/track`.
4. Otvori svoj **Affiliate Sheet** → tab **Clicks**. Trebalo bi da se pojavi **novi red** sa datumom/vremenom, affiliate_code (DAMIJAN123), visitor_id, itd.
5. Ako se red **ne pojavi:** proveri B5.1 (sheet-status); proveri da li je Sheet podeljen sa `client_email` sa pravom **Editor**; proveri Vercel **Functions** log za greške (Settings → Functions ili Deployments → poslednji deploy → Logs).

### B5.3 Test lead
1. U **istom** incognito prozoru (da ostane cookie `af_ref`) otvori glavnu stranicu i nađi formu (email + po želji telefon).
2. Unesi test email (npr. test-affiliate@example.com) i submit.
3. Otvori Affiliate Sheet → tab **Leads**. Trebalo bi **novi red** sa tim emailom, affiliate_code = DAMIJAN123, status = new.
4. Ako se red ne pojavi: proveri da li je form submit zaista šaljeo lead (npr. da nema client-side greške); ponovo proveri sheet-status i Share na Sheet-u.

### B5.4 Provera da drugi leadovi ne idu u Affiliate Sheet
1. U **novom** incognito prozoru (ili obriši cookie) otvori sajt **bez** `?ref=...` u URL-u.
2. Submituj formu sa drugim emailom (npr. direct@example.com).
3. Ovaj lead treba da ode u **GHL** (i eventualno u drugi Sheet — Leads by Source), ali **ne** u Affiliate Sheet tab **Leads**. Proveri Affiliate Sheet → Leads: **ne bi trebalo** da ima red sa direct@example.com. Ako ima, to bi bila greška u logici — u trenutnoj implementaciji lead se šalje na `/api/affiliate/track` samo ako postoji cookie `af_ref`, tako da bez ref linka ne bi trebalo da se upisuje u Affiliate Sheet.

---

## B6. Rezime — šta ti treba da uradiš (checklist)

- [ ] Napravio sam **nov** Google Sheet (ne koristim postojeći za druge leadove).
- [ ] U njemu imam tabove tačno **Clicks** i **Leads** (ili sam uneo AFFILIATE_SHEET_CLICKS_NAME / AFFILIATE_SHEET_LEADS_NAME u Vercel).
- [ ] Kopirao sam **samo ID** spreadsheet-a iz URL-a (deo između `/d/` i `/edit`).
- [ ] Sheet sam **podelio** sa `client_email` iz Service Account JSON-a sa pravom **Editor**.
- [ ] U Vercel env dodao **AFFILIATE_SHEET_ID** (vrednost = samo ID) i **GOOGLE_SERVICE_ACCOUNT_JSON** (ceo JSON).
- [ ] Uradio **Redeploy** posle izmene env.
- [ ] U Supabase u tabelu **affiliates** dodao bar jedan red sa test kodom (npr. DAMIJAN123) i **status = active**.
- [ ] Otvorio **/api/affiliate/sheet-status** i proverio da je **configured: true**.
- [ ] Testirao u incognito: ulaz preko **?ref=DAMIJAN123** → red u tabu Clicks; submit forme → red u tabu Leads.
- [ ] Proverio da lead **bez** ref linka **ne** ulazi u Affiliate Sheet.

---

# DEO C — Novi affiliate: kako napraviti link i povezati da se ulaz zabeleži

Kad dodaš novog člana u affiliate program, treba da mu daš **link** i da u bazi **povežeš** taj link za njega — tada će svaki ulaz preko tog linka biti zabeležen (klik u Sheet + Supabase, a ako posetilac submituje formu — i lead).

---

## C1. Kako izgleda link za novog korisnika

**Kod** = jedinstvena oznaka za tog affiliate-a (npr. **NIKOLA777**, **ANA2026**). Bez razmaka, preporučeno velika slova (sajt ih i tako normalizuje).

Zameni u linkovima ispod:
- **tvoj-domen.com** → tvoj stvarni domen (npr. aihype-academy.com).
- **KOD** → kod koji dodeljuješ tom članu (npr. NIKOLA777).

### Dva formata linka

**1. Kratki link (najpraktičniji za deljenje)**  
```
https://tvoj-domen.com/ref/KOD
```  
Primer: `https://aihype-academy.com/ref/NIKOLA777`  
- Kad neko otvori ovaj URL, sajt ga prebaci na glavnu stranicu sa `?ref=NIKOLA777` i postavi cookie `af_ref`.
- Jedan klik = jedan red u Affiliate Sheet (tab Clicks) i u Supabase `affiliate_clicks` (ako je affiliate u bazi aktivan).

**2. Pun link (sa UTM parametrima, za analitiku)**  
```
https://tvoj-domen.com/?ref=KOD&utm_source=affiliate&utm_medium=referral&utm_campaign=KOD
```  
Primer: `https://aihype-academy.com/?ref=NIKOLA777&utm_source=affiliate&utm_medium=referral&utm_campaign=NIKOLA777`  
- Isti efekat: cookie `af_ref` = KOD, klik i lead se vezuju za tog affiliate-a. UTM možeš koristiti u Google Analytics ili drugim alatima.

**Šta da pošalješ članu:** Obično dovoljno **kratki link** (ref/KOD). Ako želiš UTM, pošalji pun link.

---

## C2. Šta moraš da povežeš da bi se ulaz zabeležio

Da bi kad neko uđe preko linka **sve bilo zabeleženo** (klik u Sheet, klik u Supabase za dashboard, a kasnije i lead u Sheet i GHL), moraš da **dodaš tog člana u Supabase** pod tim kodom. Bez toga:
- Klik će i dalje otići u **Affiliate Sheet** (tab Clicks) ako je AFFILIATE_SHEET_ID podešen — jer sajt šalje click sa `affiliate_code` koji je u URL-u/cookie-u.
- Ali u **Supabase** tabelu `affiliate_clicks` neće ući red ako u tabeli `affiliates` nema reda sa tim kodom i `status = active` (sajt proverava da li je code “aktivan” pre upisa u Supabase). Takođe, **affiliate dashboard** (statistika za njega) čita iz Supabase — pa bez reda u `affiliates` taj član neće imati statistiku.

**Zaključak:** Da bi sve bilo “povezano” i da se ulaz zabeleži i za Sheet i za dashboard, **moraš** da dodaš novog člana u tabelu **affiliates** u Supabase sa tačno onim **KOD**om koji stoji u linku.

---

## C3. Korak po korak — dodavanje novog affiliate-a i link

### Korak 1: Odluči kod za tog člana
- Npr. **NIKOLA777** ili **ANA2026**. Jedinstven, bez razmaka. Preporučeno velika slova.

### Korak 2: Dodaj ga u Supabase (da se ulaz zabeleži i za dashboard)
1. Otvori **Supabase** → svoj projekat → **Table Editor** → tabela **affiliates**.
2. **Insert row** (ili Add row).
3. Popuni:
   - **affiliate_code** — tačno onaj kod koji će biti u linku, npr. **NIKOLA777** (bez razmaka).
   - **status** — **active** (obavezno; inače se u Supabase ne upisuju klikovi za njega).
   - **name** / **affiliate_name** — npr. Nikola (ime člana).
   - **email** — njegov email, ako je kolona obavezna.
4. Sačuvaj.

### Korak 3: Napravi link
- Kratki: `https://tvoj-domen.com/ref/NIKOLA777`
- Pun: `https://tvoj-domen.com/?ref=NIKOLA777&utm_source=affiliate&utm_medium=referral&utm_campaign=NIKOLA777`

### Korak 4: Pošalji link članu
- Npr. emailom ili porukom. On deli taj link; ko god uđe preko njega — zabeleži se klik (i kasnije lead ako submituje formu).

### Korak 5: Provera (opciono)
- Incognito prozor → otvori **kratki** ili **pun** link sa tim kodom.
- Proveri Affiliate Sheet → tab **Clicks**: novi red sa tim `affiliate_code`.
- Proveri Supabase → **affiliate_clicks**: jedan red za tog affiliate-a (ako je u `affiliates` sa status = active).

**Ništa u kodu ne menjaš** — za svakog novog člana samo novi red u Supabase i novi link u kome menjaš samo **KOD**.

---

## C4. Rezime — link i povezivanje

| Šta | Kako |
|-----|------|
| Link za novog korisnika | `https://tvoj-domen.com/ref/KOD` ili pun link sa `?ref=KOD&utm_source=affiliate&...` |
| Da se ulaz zabeleži | U Supabase u tabelu **affiliates** dodaj red: **affiliate_code** = KOD, **status** = active, ime/email. |
| Gde se beleži klik | Affiliate Sheet (tab Clicks) + Supabase (affiliate_clicks). |
| Gde se beleži lead | Kad posetilac submituje formu (sa cookie `af_ref`): Affiliate Sheet (tab Leads) + GHL (sa affiliate_code). |

---

# DEO D — Kratka referenca (samo ovaj fajl)

| Šta | Gde / kako |
|-----|------------|
| Ovaj Sheet prima | Samo klikove i leadove sa affiliate linka (cookie `af_ref`). Ništa drugo. |
| Env obavezno za ovaj Sheet | `AFFILIATE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON` |
| Provera podešavanja | `GET https://tvoj-domen.com/api/affiliate/sheet-status` → `configured: true` |
| Nazivi tabova (default) | **Clicks**, **Leads** |
| Make | Nije potreban. Ako želiš samo Sheet — ne postavljaj MAKE_WEBHOOK_URL. |
| **Link za novog affiliate-a** | `https://tvoj-domen.com/ref/KOD` (KOD = jedinstveni kod). |
| **Povezivanje da se zabeleži ulaz** | U Supabase tabela **affiliates**: red sa **affiliate_code** = KOD, **status** = active. |

Ako sve uradiš kako je gore opisano, podaci neće odlaziti negde drugde i neće dolaziti do greške zbog pogrešnog Sheet-a ili nedostajućih env varijabli. Ovaj fajl je samostalan — u njemu je i kako da napraviš link za novog korisnika i kako da povežeš da se ulaz zabeleži.
