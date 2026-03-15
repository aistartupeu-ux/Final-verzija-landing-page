# Affiliate program — kompletan setup vodič (0 → 100%)

Sistem automatski:
- beleži **klik** kad neko dođe preko affiliate linka
- beleži **lead** samo ako je došao preko affiliate linka **i** submitovao formu
- upisuje sve u Google Sheets (Make) + šalje u GoHighLevel sa `affiliate_code`

---

## 1. Formati affiliate linkova

### Direktni link
```
https://www.aihype-academy.com/?ref=DAMIJAN123
```

### Sa UTM (preporučeno)
```
https://www.aihype-academy.com/?ref=DAMIJAN123&utm_source=affiliate&utm_medium=referral&utm_campaign=DAMIJAN123
```

### Kratki link (redirect)
```
https://www.aihype-academy.com/ref/DAMIJAN123
```
→ automatski redirect na `/?ref=DAMIJAN123` i postavlja cookie

**`ref` je ključ za atribuciju.** UTM je dodatna analitika.

---

## 2. Šta radi kod (Vercel)

### Na ulaz (svaka stranica)
- `AffiliateTracker` (u root layoutu) se učitava
- čita `?ref=` ili `utm_campaign` iz URL-a
- upisuje `af_ref` u cookie (30 dana)
- generiše `af_vid` (visitor_id)
- šalje **click** event na `/api/affiliate/track` (1× po visitor+affiliate)

### Na submit forme
- EmailForm (Hero, CTA, Final CTA), Join stranica, Special gate
- nakon uspešnog submit-a: ako postoji `af_ref`, šalje **lead** event na `/api/affiliate/track`

### `/api/affiliate/track`
- prima `event_type: "click"` ili `"lead"`
- validira payload
- prosleđuje na `MAKE_WEBHOOK_URL`

### `/api/leads`
- čita `af_ref` iz cookie
- u GHL webhook payload dodaje `affiliate_code` i `source: "affiliate"` kad postoji

---

## 3. Google Sheets (Make baza)

Napravi Sheet: **AHA_Affiliate_System**

### Tab 1: Affiliates
| affiliate_code | affiliate_name | status    | joined_at |
|----------------|----------------|-----------|-----------|
| DAMIJAN123     | Damijan        | active    | 2026-03-01 |
| NIKOLA777      | Nikola         | active    | 2026-03-05 |

### Tab 2: Clicks
| clicked_at | affiliate_code | visitor_id | page_url | utm_source | utm_campaign |
|------------|----------------|------------|----------|------------|--------------|
| ...        | DAMIJAN123     | abc123     | ...      | affiliate  | DAMIJAN123   |

**click_key** (opciono): `visitor_id|affiliate_code` — za dedupe (1 click po visitor+affiliate)

### Tab 3: Leads
| created_at | email | phone | affiliate_code | visitor_id | page_url | utm_source | status |
|------------|-------|-------|----------------|------------|----------|------------|--------|
| ...        | ...   | ...   | DAMIJAN123     | ...        | ...      | ...        | new    |

**lead_key** (opciono): `lower(email)|affiliate_code` — za ignorisanje duplikata

### Tab 4: Summary
```
=QUERY(Leads!A:H, "select D, count(B) where D is not null group by D label count(B) 'Leads'", 1)
```

---

## 4. GoHighLevel

### 4.1 Custom field
- Settings → Custom Fields → Add
- **affiliate_code** (Text)

### 4.2 Tagovi
- `waitlist`
- `src:affiliate`

### 4.3 Webhook mapping
U workflow-u koji prima inbound webhook, mapiraj:
- `affiliate_code` → custom field `affiliate_code`
- `source` → može da bude "affiliate" ili "AI Hype Academy"

---

## 5. Make.com scenario

### Modul 1: Webhooks → Custom webhook

**Šta je Webhook URL i zašto ti treba?**  
Webhook je "adresa" koju tvoj sajt koristi da pošalje podatke u Make. Kada neko klikne na affiliate link ili submit-uje formu, sajt šalje informaciju na tu adresu. Make prima podatke i upisuje ih u Google Sheet.

**Gde tačno da nađeš Webhook URL u Make-u:**

1. Nakon što dodaš modul **Custom webhook** u scenario, Make će ga automatski kreirati.
2. U modulu ćeš videti nekoliko polja. Tražiš polje pod nazivom **"Webhook URLs"** ili **"Webhook URL"** (jednina).
3. Ispod toga je link koji počinje sa `https://hook.` — npr. `https://hook.eu1.make.com/abc123xyz456` ili `https://hook.us1.make.com/xyz789`.
4. Pored linka obično postoji ikonica **kopiraj** (dva pravougaonika) — klikni na nju da kopiraš URL.
5. **Alternativa:** Selektuj ceo URL misem (od `https` do kraja), desni klik → Kopiraj.

**Kako izgleda:**  
Tipičan primer: `https://hook.eu1.make.com/xxxxxxxxxxxxxxxx`  
(Reči `eu1` ili `us1` označavaju region; dugi string na kraju je jedinstven za tvoj webhook.)

**Važno:** Ovaj URL NE deli sa nikim. To je tvoja "tajna adresa" — samo tvoj sajt (Vercel) treba da ga koristi. Zato ga stavljaš u Vercel kao env varijablu, a ne u kod.

### Modul 2: Router
- **event_type = "click"** → grana Clicks
- **event_type = "lead"** → grana Leads

### Grana Clicks
1. (Opciono) Search Rows u Affiliates → `affiliate_code` = payload.affiliate_code, filter `status = active`
2. (Opciono) Dedupe po `click_key` = visitor_id|affiliate_code
3. Add a Row u Clicks tab

### Grana Leads
1. Search Rows u Affiliates → `affiliate_code` = payload.affiliate_code, filter `status = active`
2. Search Rows u Leads po `lead_key` — ako postoji → STOP (ignore duplikat)
3. Add a Row u Leads tab
4. (Opciono) HTTP → POST na GHL Contacts API da upsertuje kontakt sa `affiliate_code`

**Napomena:** Leadovi već idu u GHL preko tvog `GHL_WEBHOOK_URL` iz `/api/leads`, sa `affiliate_code` u payload-u. Make može da radi samo Sheets, ili i GHL upsert ako želiš drugu logiku.

---

## 6. Vercel env varijable

| Varijabla           | Opis                           |
|---------------------|--------------------------------|
| `MAKE_WEBHOOK_URL`  | Make custom webhook URL        |
| `GHL_WEBHOOK_URL`   | HighLevel inbound webhook URL  |

Bez `MAKE_WEBHOOK_URL` click/lead eventi se ne šalju u Make (endpoint vraća 503).

---

## 7. Dodavanje novog affiliate-a

1. U Affiliates tab dodaj red:
   - `affiliate_code`: NIKOLA777
   - `affiliate_name`: Nikola
   - `status`: active

2. Pošalji mu link:
   ```
   https://www.aihype-academy.com/?ref=NIKOLA777&utm_source=affiliate&utm_medium=referral&utm_campaign=NIKOLA777
   ```
   ili kratki: `https://www.aihype-academy.com/ref/NIKOLA777`

---

## 8. Dashboard po affiliate-u

Za affiliate-a napravi novi Sheet (npr. **AHA - Nikola**):

```
=FILTER(
  IMPORTRANGE("MASTER_SHEET_ID","Leads!A:J"),
  INDEX(IMPORTRANGE("MASTER_SHEET_ID","Leads!A:J"),,4)="NIKOLA777",
  INDEX(IMPORTRANGE("MASTER_SHEET_ID","Leads!A:J"),,9)="new"
)
```

Share tom affiliate-u **view-only**.

---

## 9. Test

1. Incognito: `https://www.aihype-academy.com/?ref=DAMIJAN123`
2. Proveri Clicks tab → upisan red
3. Submit formu (email + telefon)
4. Proveri Leads tab → red sa `affiliate_code = DAMIJAN123`
5. Proveri GHL kontakt → custom field `affiliate_code` = DAMIJAN123
6. Ponovi submit sa istim emailom → ne bi trebalo novi red (Make dedupe)

---

## 10. Gde je logika u kodu

| Fajl | Uloga |
|------|-------|
| `lib/affiliate-tracking.ts` | Cookie, init, trackClickOnce, trackAffiliateLeadOnSubmit |
| `components/AffiliateTracker.tsx` | Mount: init + click |
| `app/api/affiliate/track/route.ts` | Prima click/lead, šalje u Make |
| `app/api/leads/route.ts` | Čita af_ref, dodaje affiliate_code u GHL payload |
| `components/ui/EmailForm.tsx` | Nakon submit → trackAffiliateLeadOnSubmit |
| `app/join/page.tsx` | Capture ref, nakon submit → trackAffiliateLeadOnSubmit |
| `app/special/page.tsx` | Capture ref, nakon submit → trackAffiliateLeadOnSubmit |
| `app/ref/[code]/route.ts` | Redirect na /?ref=, postavlja af_ref cookie |

---

## 11. Šta ti treba da uradiš (korak po korak)

### 1. Google Sheet
- Napravi **AHA_Affiliate_System**
- Tabovi: Affiliates, Clicks, Leads, Summary (kao u sekciji 3)
- U Affiliates dodaj Damijana:
  - `affiliate_code`: DAMIJAN123
  - `affiliate_name`: Damijan
  - `status`: active
  - `joined_at`: danas

### 2. Make.com
- Napravi scenario sa Webhooks → Custom webhook
- Kopiraj **Webhook URL**
- Poveži router + Add Row za Clicks i Leads (kao u sekciji 5)

### 3. Vercel
- Settings → Environment Variables
- Dodaj: `MAKE_WEBHOOK_URL` = (Make webhook URL)
- **Redeploy** projekat

### 4. GoHighLevel
- Custom field: `affiliate_code` (Text) — vidi detaljno u sekciji 12
- U workflow-u koji prima leadove: mapiraj `affiliate_code` iz webhook payload-a  
  **→ Kompletno "šta da klikneš" vodič:** `AFFILIATE_MAPIRANJE_GHL.md`

### 5. Supabase (za /ref/DAMIJAN123 redirect)
- U tabelu `affiliates` dodaj Damijana — vidi detaljno u sekciji 12

### 6. Pošalji Damijanu link
```
https://www.aihype-academy.com/?ref=DAMIJAN123&utm_source=affiliate&utm_medium=referral&utm_campaign=DAMIJAN123
```
ili kratki: `https://www.aihype-academy.com/ref/DAMIJAN123`

### 7. Test
- Incognito → otvori Damijanov link
- Submit formu sa test emailom
- Proveri: Clicks tab, Leads tab, GHL kontakt

---

## 12. Detaljni koraci — Make, Vercel, GHL, Supabase

### 2. Make.com — korak po korak

#### 2.1 Otvori Make i napravi scenario
1. Idi na [make.com](https://www.make.com) i uloguj se
2. Klikni **Create a new scenario** (ili **Scenarios** → **Create scenario**)
3. Prazan scenario se otvara

#### 2.2 Modul 1 — Webhook (i odakle kopirati URL)

1. Klikni na **+** (dodaj modul) u centru scenarija
2. U pretrazi upiši **Webhooks** i izaberi **Custom webhook**
3. Klikni **Add** (ili **Create**)
4. Otvoriće se prozor sa podešavanjima modula. Make automatski kreira webhook — nemaš šta da podesiš.

5. **ODAKLE KOPIRATI WEBHOOK URL:**
   - U tom prozoru traži naslov **"Webhook URLs"** ili **"Custom webhook"**
   - Ispod njega je lista. Obično ima jedan red sa kolonama **"Webhook"** i **"URL"**
   - U koloni **URL** vidićeš link tipa: `https://hook.eu1.make.com/abc123def456...`
   - **Klikni na ikonicu "Copy" (dva pravougaonika)** pored tog URL-a — to kopira adresu u clipboard
   - Ili: **selektuj ceo URL** (od https do kraja) — trostruki klik da selektuješ liniju — pa Ctrl+C (Windows) ili Cmd+C (Mac)

6. **Nalepi URL negde sigurno** (Notepad, Notes) — trebace ti za Vercel u koraku 3. Izgleda ovako:
   ```
   https://hook.eu1.make.com/xxxxxxxxxxxxxxxx
   ```

7. Klikni **OK** da zatvoriš modul.

#### 2.3 Modul 2 — Router
1. Klikni **+** ispod webhook modula
2. Pretražuj **Router**
3. Izaberi **Router** i dodaj
4. Router ima default jednu rutu. Klikni **Add a route** da dodaš drugu
5. Sada imaš **Route 1** i **Route 2**

**Route 1 — za Clicks:**
1. Klikni na Route 1
2. U **Label** stavi: `Clicks`
3. U filter uslov dodaj:
   - **event_type** (iz webhook payload-a) **equals** `click`
4. Klikni **OK**

**Route 2 — za Leads:**
1. Klikni na Route 2
2. U **Label** stavi: `Leads`
3. U filter uslov dodaj:
   - **event_type** (iz webhook payload-a) **equals** `lead`
4. Klikni **OK**

#### 2.4 Grana Clicks — Add Row u Google Sheets
1. Klikni **+** ispod Route 1 (Clicks)
2. Izaberi **Google Sheets** → **Add a row**
3. Poveži svoj Google nalog (ako već nisi)
4. Izaberi Sheet: **AHA_Affiliate_System**
5. Izaberi sheet (worksheet): **Clicks**
6. Mapiraj kolone:
   - `clicked_at` ← `1` (ili `created_at` iz payload-a, ili ostavi prazno i Make će dodati timestamp)
   - `affiliate_code` ← mapiraj iz webhook `affiliate_code`
   - `visitor_id` ← `visitor_id`
   - `page_url` ← `page_url`
   - `utm_source` ← `utm_source`
   - `utm_campaign` ← `utm_campaign`
7. Klikni **OK**

#### 2.5 Grana Leads — Add Row u Google Sheets
1. Klikni **+** ispod Route 2 (Leads)
2. Izaberi **Google Sheets** → **Add a row**
3. Izaberi Sheet: **AHA_Affiliate_System**
4. Izaberi worksheet: **Leads**
5. Mapiraj kolone:
   - `created_at` ← `created_at` iz payload-a
   - `email` ← `email`
   - `phone` ← `phone`
   - `affiliate_code` ← `affiliate_code`
   - `visitor_id` ← `visitor_id`
   - `page_url` ← `page_url`
   - `utm_source` ← `utm_source`
   - `utm_campaign` ← `utm_campaign`
   - `status` ← unesi fiksno: `new`
6. Klikni **OK**

#### 2.6 Sačuvaj i aktiviraj scenario
1. Klikni **Save** (donje levo)
2. Uključi scenario (prekidač **OFF** → **ON**)
3. Webhook je sada aktivan i prima podatke

**Napomena:** Ako Make traži da izabereš "webhook data" pri mapiranju — prvo pošalji test request sa sajta (otvori link sa ?ref=DAMIJAN123), pa Make će primiti primer payload-a i moći ćeš da mapiraš polja.

---

### 3. Vercel — korak po korak

#### 3.1 Otvori projekat
1. Idi na [vercel.com](https://vercel.com) i uloguj se
2. Klikni na projekat **AI Hype Academy** (ili kako god se zove)

#### 3.2 Dodaj env varijablu
1. Otvori **Settings** (gornji tab)
2. U levom meniju klikni **Environment Variables**
3. U polje **Key** upiši tačno: `MAKE_WEBHOOK_URL` (velika slova, donja crta)
4. U polje **Value** nalepi **onaj URL koji si kopirao iz Make-a** (Ctrl+V / Cmd+V). Trebalo bi da izgleda kao: `https://hook.eu1.make.com/abc123...` — bez navodnika, bez razmaka na početku ili kraju
5. Izaberi **Production** (i opciono **Preview** ako želiš i za preview deploye)
6. Klikni **Save**

#### 3.3 Redeploy
1. Otvori tab **Deployments**
2. Nađi poslednji deployment (vrh liste)
3. Klikni na tri tačkice **⋯** pored njega
4. Izaberi **Redeploy**
5. Potvrdi **Redeploy** — Vercel će ponovo deployovati sa novom env varijablom

**Alternativa:** Ako imaš povezan Git, možeš napraviti prazan commit (`git commit --allow-empty -m "Trigger deploy"`) i push — to takođe pokreće novi deploy.

---

### 4. GoHighLevel — korak po korak

**Zašto ovo treba?**  
Kada lead dođe preko affiliate linka, tvoj sajt šalje u GHL i polje `affiliate_code`. Da bi GHL zapamtio ko je doveo tog lead-a, mora da ima custom field gde će tu vrednost upisati. Zatim u workflow-u moraš mapirati da se ta vrednost iz webhook-a upiše u taj field.

---

#### 4.1 Gde je Settings i kako da nađeš Custom Fields

1. **Uloguj se** u GoHighLevel (app.gohighlevel.com ili tvoja white-label domena)
2. **Izaberi Location** — ako imaš više lokacija (sub-accounta), izaberi onu za AI Hype Academy
3. **Settings** — obično je ikonica **zupčanika** (⚙️) u levom sidebar-u, ili u donjem levom uglu. Klikni na nju.
4. U levom meniju traži **Custom Fields**. Može biti pod:
   - **Business** → **Custom Fields**, ili
   - **Contacts** → **Custom Fields**, ili
   - direktno **Custom Fields** u glavnom meniju
5. Ako vidiš listu postojećih polja, super — to je pravo mesto.

---

#### 4.2 Kako da dodaš novo polje ` `

1. Klikni **Add Custom Field** (ili **+ New Field** / **Create Custom Field** — zavisi od verzije)
2. Otvoriće se forma. Popuni:
   - **Field Name** (ili **Label**): upiši tačno `affiliate_code` — malim slovima, donja crta između reči
   - **Field Type** (ili **Data Type**): izaberi **Text** ili **Single Line Text** — ne dropdown, ne number
   - **Object** (ili **Apply to**): izaberi **Contact** — ovo polje se odnosi na kontakte
3. Ostala polja (required, visible itd.) možeš ostaviti default
4. Klikni **Save** / **Create**

**Provera:** U listi custom field-ova trebalo bi da se pojavi `affiliate_code` pod Contact poljima.

---

#### 4.3 Gde je workflow koji prima leadove

Leadovi idu u GHL preko **Inbound Webhook** — tvoj sajt šalje POST request na URL koji si uneo kao `GHL_WEBHOOK_URL` u Vercel. Taj URL pokreće workflow.

1. Idi u **Automation** (ikonica zastavice/geara ili "Automation" u meniju)
2. Klikni **Workflows**
3. Nađi workflow koji ima **Inbound Webhook** kao trigger (prvi modul)
4. Otvori ga (klik na naziv)     

---

#### 4.4 Mapiranje `affiliate_code` u Create Contact akciji

1. U workflow-u nađi akciju **Create Contact** ili **Add/Update Contact** — obično je druga ili treća u nizu posle webhook triggera
2. **Klikni na tu akciju** da otvoriš podešavanja (ili dupli klik)
3. Skroluj nadole dok ne nađeš sekciju **Custom Fields** / **Map Custom Fields** / **Additional Fields**
4. Trebalo bi da vidiš listu custom polja. Nađi **affiliate_code** (onaj koji si upravo kreirao)
5. Pored njega je polje za vrednost. Klikni u njega.
6. Otvoriće se picker. Izaberi **Webhook** / **Inbound Webhook** / **Trigger** kao izvor, pa zatim polje **affiliate_code** (ili `affiliate_code` iz body-ja)
   - U novijim GHL verzijama: **Insert merge field** → **Webhook** → **affiliate_code**
   - Ili ručno upiši: `{{workflow.affiliate_code}}` / `{{trigger.affiliate_code}}` — sintaksa može varirati, GHL će ponuditi dostupna polja
7. Sačuvaj akciju (OK / Save)
8. Sačuvaj ceo workflow (Save gore desno)

**Ako ne vidiš `affiliate_code` u listi:** Proveri da li je webhook primio bar jedan request sa tim poljem. Ponekad GHL "uči" polja iz prvog primljenog request-a. Pošalji test lead sa sajta (preko affiliate linka), pa ponovo otvori workflow i proveri da li sada nudi `affiliate_code`.

---

### 5. Supabase — korak po korak (za /ref/DAMIJAN123)

**Zašto ovo treba?**  
Kratki link `aihype-academy.com/ref/DAMIJAN123` radi ovako: kada neko otvori taj link, sajt proverava u bazi da li postoji affiliate sa kodom `DAMIJAN123` i da li je `status = active`. Ako da — beleži klik i redirect-uje na glavnu stranicu. Ako ne — redirect bez snimanja. Zato Damijan mora biti u tabeli `affiliates`.

**Direktni link** `?ref=DAMIJAN123` radi i bez Supabase (cookie se postavlja direktno). Ali **kratki link** `/ref/DAMIJAN123` zahteva ovaj korak.

---

#### 5.1 Kako da uđeš u Supabase

1. Otvori [supabase.com](https://supabase.com) u browser-u
2. Uloguj se (Sign in)
3. Na dashboard-u vidiš listu projekata. **Klikni na projekat** za AI Hype Academy (ime može biti drugačije — onaj gde je baza za ovaj sajt)

---

#### 5.2 Gde je Table Editor i tabela `affiliates`

1. U levom sidebar-u nađi **Table Editor** (ikonica tabele ili "Table Editor" u tekstu)
2. Klikni na njega
3. U listi tabela sa leve strane trebalo bi da vidiš **affiliates**. Ako ne vidiš — proveri da li si u pravom projektu
4. **Klikni na `affiliates`** — otvoriće se prikaz tabele sa kolonama i redovima

---

#### 5.3 Šta vidiš u tabeli — kolone

Tipične kolone u `affiliates`:
- `id` — automatski (UUID ili broj), ne diraj
- `affiliate_code` — tekst, npr. DAMIJAN123
- `name` ili `affiliate_name` — ime affiliate-a
- `email` — email (često obavezan)
- `status` — active / inactive / suspended
- `created_at` — automatski timestamp
- eventualno `password_hash`, `commission_rate` itd.

Svaki red = jedan affiliate.

---

#### 5.4 Kako da dodaš Damijana — tačno šta da uneseš

1. Klikni dugme **Insert row** (gore desno) ili **+ Insert** — ili ikonicu plus pored naziva tabele
2. Otvoriće se modal/dialog ili inline forma sa poljima
3. Popuni **obavezna polja** (obično imaju crvenu zvezdicu ili su označena kao NOT NULL):

   | Kolona | Šta uneti |
   |--------|-----------|
   | `affiliate_code` | `DAMIJAN123` (velika slova, bez razmaka) |
   | `status` | `active` |
   | `name` (ili `affiliate_name`) | `Damijan` |
   | `email` | Damijanov pravi email (ako je obavezan) |

4. **Opciona polja:** Ostavi prazno ili unesi ako ima smisla (npr. `commission_rate`, `notes`)
5. **Ne diraj:** `id`, `created_at`, `updated_at` — Supabase ih popunjava automatski
6. Klikni **Save** / **Insert** / **Add row**

---

#### 5.5 Ako tabela traži `password_hash` ili druga polja

Ako `affiliates` ima kolonu `password_hash` (za affiliate login), možeš:
- Ostaviti prazno ako nije obavezna, ili
- Generisati placeholder: za sada možeš staviti bilo šta (npr. `temp`) — Damijan može kasnije da resetuje lozinku kroz affiliate panel. Ili pitaj developer-a za default.

Ako nešto ne možeš da sačuvaš (greška "column X is required"), popuni to polje sa minimalnom validnom vrednošću.

---

#### 5.6 Provera

Posle čuvanja, u tabeli bi trebalo da vidiš novi red sa `affiliate_code = DAMIJAN123`. Tada kratki link `aihype-academy.com/ref/DAMIJAN123` treba da radi.

---

### 6. Link za Damijana

**Pun link (sa UTM):**
```
https://www.aihype-academy.com/?ref=DAMIJAN123&utm_source=affiliate&utm_medium=referral&utm_campaign=DAMIJAN123
```

**Kratki link (redirect):**
```
https://www.aihype-academy.com/ref/DAMIJAN123
```

Oba vode na isti landing. Kratki zahteva da Damijan bude u Supabase tabeli `affiliates`.

---

### 7. Test — korak po korak

1. **Otvori incognito prozor** (Ctrl+Shift+N u Chrome-u, ili File → New Private Window)
2. U address bar unesi: `https://www.aihype-academy.com/?ref=DAMIJAN123`
3. Stranica se učitava — u pozadini se šalje click event
4. **Proveri Clicks tab** u Google Sheet-u — trebalo bi da se pojavi novi red sa `affiliate_code = DAMIJAN123`
5. **Submit formu** — unesi test email (npr. `test-damijan@example.com`) i telefon
6. Klikni **Join the Hype** / **Završi**
7. **Proveri Leads tab** — novi red sa `affiliate_code = DAMIJAN123`, `email` = tvoj test email
8. **Proveri GoHighLevel** → Contacts — nađi kontakt po tom email-u, otvori ga i proveri da custom field `affiliate_code` ima vrednost `DAMIJAN123`
9. **Opciono:** Ponovi submit sa istim emailom — u Leads ne bi trebalo da se doda dupli red (ako si u Make-u dodao dedupe logiku)
