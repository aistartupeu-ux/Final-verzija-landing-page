# Affiliate program — checklista i novi članovi

## 1. Gde idu affiliate podaci (Sheet)

Možeš raditi **bez Make** — direktan upis u **jedan Google Sheet samo za affiliate** (odvojen od ostalih leadova).

| Način | Env | Gde idu klikovi/leadovi |
|-------|-----|--------------------------|
| **Direktno u Sheet (preporučeno)** | `AFFILIATE_SHEET_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON` | Jedan Sheet, tabovi **Clicks** i **Leads** — samo affiliate, bez mešanja. Detaljno: **AFFILIATE_SHEET_BEZ_MAKE.md** |
| **Preko Make** | `MAKE_WEBHOOK_URL` | Make scenario upisuje u Sheet (Clicks/Leads). Može i oba: Sheet direktno + Make. |

- Ako je podešen **AFFILIATE_SHEET_ID**, track upisuje **direktno** u taj Sheet (Clicks + Leads). Make nije obavezan.
- Ako želiš i Make, ostavi i `MAKE_WEBHOOK_URL` — tada se šalje i u Sheet i u Make.
- Provera: otvori `https://tvoj-domen.com/api/affiliate/sheet-status` → treba `configured: true`.

---

## 2. Checklista — da li sve radi

Koristi ovo kada proveravaš da li je ceo affiliate tok u redu.

### 2.1 Podešavanja (jednom)

**Varijanta A — samo Sheet (bez Make):**
- [ ] **Vercel:** `AFFILIATE_SHEET_ID` (ID spreadsheet-a samo za affiliate) + `GOOGLE_SERVICE_ACCOUNT_JSON` (Service Account key). Redeploy.
- [ ] **Google Sheet:** Poseban spreadsheet za affiliate; tabovi **Clicks** i **Leads**; podeljen sa `client_email` iz JSON-a (Editor). Uputstvo: **AFFILIATE_SHEET_BEZ_MAKE.md**.
- [ ] **Provera:** `https://tvoj-domen.com/api/affiliate/sheet-status` → `configured: true`.

**Varijanta B — Make (opciono, pored ili umesto Sheet-a):**
- [ ] **Vercel:** `MAKE_WEBHOOK_URL` postavljen, redeploy.
- [ ] **Make:** Scenario ON, Webhook → Router → Google Sheets (Clicks + Leads).

**Zajedničko:**
- [ ] **Supabase:** Tabela `affiliates` postoji; bar jedan red sa `affiliate_code` (npr. DAMIJAN123) i `status = active`.
- [ ] **GHL:** Custom field `affiliate_code`; u workflow-u (Inbound Webhook) mapirano iz webhook-a.

### 2.2 Test ulaza (klik)

- [ ] Incognito: otvoriš `https://tvoj-domen.com/?ref=DAMIJAN123` ili `https://tvoj-domen.com/ref/DAMIJAN123`.
- [ ] U **Affiliate Sheet → tab Clicks** pojavi se novi red sa `affiliate_code = DAMIJAN123` (ako je podešen AFFILIATE_SHEET_ID; inače u Make Sheet-u).
- [ ] U **Supabase → affiliate_clicks** pojavi se jedan red za tog affiliate-a (ako je code aktivan).

### 2.3 Test leada

- [ ] U istom incognito prozoru (cookie `af_ref` ostane) submituješ formu (email + po želji telefon).
- [ ] U **Affiliate Sheet → tab Leads** pojavi se red sa tim emailom i `affiliate_code = DAMIJAN123`.
- [ ] U **GHL** nađeš kontakt po email-u; custom field **affiliate_code** = DAMIJAN123.

### 2.4 Pratite vi vs affiliate

- [ ] **Vi:** GHL (kontakti + affiliate_code), Sheet (Clicks + Leads), Supabase (affiliate_clicks).
- [ ] **Affiliate:** Dashboard koji koristi `/api/affiliate/stats` (čita iz Supabase) — vidi svoje klikove/leadove.

Ako sve tačke prolaze, šalje se u Sheet (gde je Damijan) i sve je povezano.

---

## 3. Novi članovi — kako link izgleda i šta sve da dodaš

### 3.1 Kako link izgleda

**Kratki (preporučeno za deljenje):**
```
https://www.aihype-academy.com/ref/KOD
```
Zameni `KOD` jedinstvenim kodom za tog člana (npr. `NIKOLA777`, `ANA2026`). Velika/mala slova se normalizuju u velika.

**Pun link (sa UTM):**
```
https://www.aihype-academy.com/?ref=KOD&utm_source=affiliate&utm_medium=referral&utm_campaign=KOD
```

**Primer za novog člana „Nikola”:**
- Kratki: `https://www.aihype-academy.com/ref/NIKOLA777`
- Pun: `https://www.aihype-academy.com/?ref=NIKOLA777&utm_source=affiliate&utm_medium=referral&utm_campaign=NIKOLA777`

Oba vode na glavnu stranicu; cookie `af_ref` se postavlja na `KOD`, pa se klikovi i leadovi vezuju za tog affiliate-a.

### 3.2 Šta moraš da dodaš da bi sve funkcionisalo

#### A) Supabase (obavezno)

Bez ovoga kratki link `/ref/KOD` i dalje radi (redirect + cookie), ali **dashboard i upis klikova u Supabase** rade samo za aktivne affiliate-e u bazi.

1. Otvori **Supabase** → projekat → **Table Editor** → tabela **`affiliates`**.
2. **Insert row** i popuni:
   - **affiliate_code** — tačno onaj kod koji ide u link (npr. `NIKOLA777`), bez razmaka, preporučeno velika slova.
   - **status** — `active`.
   - **name** / **affiliate_name** — npr. `Nikola`.
   - **email** — ako je kolona obavezna, unesi email člana.
   - Ostalo po potrebi (npr. commission, napomene); `id` i `created_at` ne diraj.

Bez ovog reda: klikovi se i dalje šalju na Make (pa u Sheet) ako neko koristi `?ref=NIKOLA777`, ali Supabase `affiliate_clicks` i dashboard neće imati zapis za tog affiliate-a ako ga nema u `affiliates` sa `status = active`.

#### B) Google Sheet — tab Affiliates (opciono)

Ako u Sheet-u imaš tab **Affiliates** (lista članova), dodaj red da možeš lako pratiti ko je ko:

| affiliate_code | affiliate_name | status | joined_at   |
|----------------|----------------|--------|-------------|
| NIKOLA777      | Nikola         | active | 2026-03-14  |

Make **ne mora** da čita ovaj tab da bi Clicks/Leads radili — to je za tvoju evidenciju. Clicks i Leads idu u svoje tabove automatski kad je `MAKE_WEBHOOK_URL` i scenario podešeni.

#### C) Šta ne moraš da menjaš u kodu

- Link format je uvek isti: zamenjuješ samo **KOD**.
- Ne dodaješ rute ni env varijable po članu — jedan `MAKE_WEBHOOK_URL`, jedna tabela `affiliates`, jedan Sheet.

### 3.3 Kratki korak-po-korak za novog člana

1. Odluči **jedinstveni kod** (npr. `NIKOLA777`).
2. **Supabase** → `affiliates` → Insert row: `affiliate_code` = NIKOLA777, `status` = active, ime/email.
3. **(Opciono)** Sheet → tab Affiliates → dodaj red sa istim kodom i imenom.
4. Pošalji članu link: `https://www.aihype-academy.com/ref/NIKOLA777` (ili pun link sa UTM).
5. Test: incognito → otvori link → proveri Clicks u Sheet-u → submituj formu → proveri Leads u Sheet-u i GHL.

---

## 4. Brza referenca — env

| Env (Vercel)        | Namena |
|---------------------|--------|
| `AFFILIATE_SHEET_ID` | Sheet **samo za affiliate** (Clicks + Leads). Direktan upis bez Make. Vidi **AFFILIATE_SHEET_BEZ_MAKE.md**. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service Account key; isti može za leads i affiliate Sheet. |
| `MAKE_WEBHOOK_URL`  | Opciono. Ako je postavljen, track šalje i u Make. Za samo Sheet — ne postavljaj. |
| `GHL_WEBHOOK_URL`   | Leadovi (svi) idu u GHL; sa cookie `af_ref` u payload-u se šalje i `affiliate_code`. |

**Bez Make:** dovoljno je `AFFILIATE_SHEET_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON`; klikovi i leadovi idu samo u taj Sheet (i u Supabase za dashboard).
