# UTM u Instagram/Facebook reklamama + Leads by Source — korak po korak

Ovaj vodič obuhvata **dva dela**: (1) kako da u Meta reklamama staviš link sa UTM parametrima da vidiš da li je lead došao sa Instagram ili Facebook reklame, i (2) kako da podešiš Leads by Source Sheet (ili webhook) da ti svi leadovi sa izvorom stignu na jedno mesto.

---

# DEO 1 — UTM linkovi u Instagram i Facebook reklamama

Da bi u Leads by Source Sheetu (i u GHL) video **utm_source: instagram** ili **utm_source: facebook**, link ka sajtu u reklami **mora** da sadrži te parametre.

## 1.1 Tačni linkovi koje treba da koristiš

Zameni **tvoj-domen.com** svojim domenom (npr. aihype-academy.com).

### Za Instagram reklamu (destination URL)

```
https://tvoj-domen.com/?utm_source=instagram&utm_medium=cpc&utm_campaign=prolece2026
```

- **utm_source=instagram** — sajt će u Sheet upisati **source_tag: instagram**.
- **utm_medium=cpc** — oznaka da je plaćeni klik (opciono).
- **utm_campaign=prolece2026** — naziv kampanje; možeš menjati (npr. waitlist_ig, kurs_2026).

### Za Facebook reklamu (destination URL)

```
https://tvoj-domen.com/?utm_source=facebook&utm_medium=cpc&utm_campaign=prolece2026
```

- **utm_source=facebook** — sajt će upisati **source_tag: facebook**.
- Ostalo isto kao gore; **utm_campaign** može biti drugačiji po kampanji (npr. waitlist_fb).

### Opciono — različite kampanje po reklami

- Instagram story: `utm_campaign=ig_story_2026`
- Facebook feed: `utm_campaign=fb_feed_2026`

Sve to zavisi od tebe; bitno je da **utm_source** bude **instagram** ili **facebook** da se u Sheetu lepo filtrira.

---

## 1.2 Gde u Meta Ads Manageru da staviš link

### A) Kreiranje nove kampanje / oglasa

1. Uđi u **Meta Business Suite** ili **Ads Manager**: [business.facebook.com](https://business.facebook.com) ili [adsmanager.facebook.com](https://adsmanager.facebook.com).
2. **Kreiraj** kampanju (Campaign) → izaberi cilj (npr. Traffic, Leads, Conversions).
3. Na nivou **Ad set** ili **Ad** (zavisi od verzije) traži sekciju gde se unosi **Website URL**, **Destination**, **Link** ili **Call to action link**.
4. U polje za **Website URL** (ili **Destination URL**) **nemoj** da staviš samo `https://tvoj-domen.com`. Stavi **ceo link sa UTM**:
   - Za Instagram:  
     `https://tvoj-domen.com/?utm_source=instagram&utm_medium=cpc&utm_campaign=prolece2026`
   - Za Facebook:  
     `https://tvoj-domen.com/?utm_source=facebook&utm_medium=cpc&utm_campaign=prolece2026`
5. Sačuvaj. Kad neko klikne na reklamu, otvoriće se sajt sa tim parametrima; sajt će ih upisati u cookie i pri submitu forme poslati u Leads by Source.

### B) Ako već imaš reklamu i menjaš samo link

1. Ads Manager → **Ads** (Oglasi) → otvori oglas koji vodi na sajt.
2. **Edit** (Uredi) → nađi polje **Website URL** / **Destination** / **Link**.
3. Zameni trenutni URL celim linkom sa UTM (kao gore). Sačuvaj.

### C) Ako imaš "URL Parameters" ili "Tracking" sekciju

U nekim verzijama postoji posebno polje za **URL parameters** (samo parametri). Tada u **Website URL** staviš:

```
https://tvoj-domen.com
```

a u **URL Parameters** (ako postoji) dodaš:

```
utm_source=instagram&utm_medium=cpc&utm_campaign=prolece2026
```

(Nema `?` na početku parametara — Meta ga sam dodaje.) Ako ne vidiš takvo polje, **najsigurnije je ceo link sa parametrima staviti u jedno polje Website URL**, kao u tačkama A i B.

---

## 1.3 Jedna reklama = jedan link

- Za **Instagram** oglase koristi link sa **utm_source=instagram** (i po želji svoj **utm_campaign**).
- Za **Facebook** oglase koristi link sa **utm_source=facebook** (i po želji svoj **utm_campaign**).

Tako u Leads by Source Sheetu u koloni **source_tag** i **utm_source** tačno vidiš da li je lead došao sa Instagram ili Facebook reklame.

---

# DEO 2 — Podešavanje Leads by Source Sheet (ili webhook)

Da bi leadovi sa izvorom (instagram, facebook, direct, affiliate) stizali na jedno mesto, treba da jedan od ova dva načina radi.

---

## Opcija A — Preko Make.com (webhook → Google Sheet)

Korak po korak.

### Korak 1: Google Sheet

1. Otvori [Google Sheets](https://sheets.google.com) i kreiraj **novi** spreadsheet.
2. Nazovi ga npr. **Leads by Source**.
3. U **prvi red** upiši zaglavlja (tačno ovim redosledom):

   | A     | B     | C     | D    | E          | F           | G          | H             | I               |
   |-------|-------|-------|------|------------|-------------|------------|---------------|-----------------|
   | date  | email | phone | name | source_tag | utm_source  | utm_medium | utm_campaign  | affiliate_code  |

4. Sačuvaj. ID spreadsheet-a ti treba samo ako kasnije koristiš direktan upis (Opcija B); za Make dovoljno je da izabereš ovaj Sheet u modulu.

### Korak 2: Make.com scenario

1. Uđi na [make.com](https://make.com) i otvori **Scenarios** → **Create a new scenario**.
2. **Prvi modul — Webhook:**
   - Dodaj modul **Webhooks** → **Custom webhook**.
   - Klikni **Add** (ili Create). Make kreira webhook.
   - U podešavanjima webhooka nađi **Webhook URL** i **kopiraj ga** (trebaće za Vercel).
   - **Važno:** Klikni **Add** pored **"Data structure"** → izaberi **JSON** → u polje zalepi tačno:
   ```json
   {"date":"","email":"","phone":"","name":"","source_tag":"","utm_source":"","utm_medium":"","utm_campaign":"","affiliate_code":""}
   ```
   - Save/OK.
3. **Drugi modul — Google Sheets:**
   - Klikni **+** ispod Webhook modula.
   - Pretraži **Google Sheets** → izaberi **Add a row**.
   - Poveži Google nalog (ako već nisi) i izaberi spreadsheet **Leads by Source** i listu (npr. Sheet1).
   - U **Values** dodaj jednu stavku po koloni i mapiraj iz Webhook modula **[1]**:
     - **A (date)** → `{{1.date}}`
     - **B (email)** → `{{1.email}}`
     - **C (phone)** → `{{1.phone}}`
     - **D (name)** → `{{1.name}}`
     - **E (source_tag)** → `{{1.source_tag}}`
     - **F (utm_source)** → `{{1.utm_source}}`
     - **G (utm_medium)** → `{{1.utm_medium}}`
     - **H (utm_campaign)** → `{{1.utm_campaign}}`
     - **I (affiliate_code)** → `{{1.affiliate_code}}`
   - Ako ne vidiš `1.date`, `1.source_tag` itd., proveri da li je Data structure u Webhooku zaista podešen (Korak 2, JSON). Save.
4. **Sačuvaj scenario** i uključi ga (**Toggle ON**). Webhook je sada aktivan.

### Korak 3: Vercel env

1. Vercel → tvoj projekat → **Settings** → **Environment Variables**.
2. Dodaj:
   - **Key:** `LEADS_SOURCE_WEBHOOK_URL`
   - **Value:** ceo URL koji si kopirao iz Make Webhook modula (npr. `https://hook.eu1.make.com/xxxxx`).
3. **Redeploy** projekat (Deployments → Redeploy poslednjeg).

### Korak 4: Provera

1. U browseru otvori:  
   `https://tvoj-domen.com/?utm_source=instagram`  
   pa submituj formu sa test emailom.
2. U **Leads by Source** Sheetu trebalo bi da se pojavi novi red sa **source_tag: instagram**, **utm_source: instagram**.
3. U Make scenariju → **History** — trebalo bi da vidiš jedan uspešan run.

Ako Sheet ostane prazan, vidi sekciju **Troubleshooting** u **LEADS_BY_SOURCE_SETUP.md** (Data structure, `1.body`, History, ručni test webhooka).

---

## Opcija B — Direktan upis u Google Sheet (bez Make)

Ako ne želiš Make, možeš koristiti **direktan upis** u isti Sheet preko Google Service Account-a (kao za leads Sheet u drugim vodičima).

1. **Google Sheet** — isto kao u Opciji A (zaglavlja: date, email, phone, name, source_tag, utm_source, utm_medium, utm_campaign, affiliate_code).
2. **Google Cloud** — Service Account, preuzmi JSON key. **Share** spreadsheet sa `client_email` iz JSON-a (Editor).
3. **Vercel env** (umesto Make webhooka):
   - `LEADS_SHEET_ID` = ID spreadsheet-a (iz URL-a: `/d/OVDE_ID/edit`).
   - `GOOGLE_SERVICE_ACCOUNT_JSON` = ceo sadržaj JSON fajla.
   - Opciono: `LEADS_SHEET_NAME` = ime lista (npr. Sheet1) ako prvi tab nije "Sheet1".
4. **Ne postavljaj** `LEADS_SOURCE_WEBHOOK_URL` — sajt će slati leadove u Sheet preko `appendLeadsToSheet` (fajl `lib/leads-sheet.ts`). To već radi za sve forme (homepage, Join, Special) kada su env varijable podešene.
5. **Redeploy**.

Detaljnije za Service Account i Sheet: **LEADS_SHEET_SETUP_DETALJNO.md** ili **LEADS_BY_SOURCE_KOMPLETAN_SETUP.md** ako ih imaš u projektu.

---

# Rezime — šta da uradiš redom

1. **UTM u reklamama:** U Meta Ads Manageru za Instagram reklamu stavi **Website URL** =  
   `https://tvoj-domen.com/?utm_source=instagram&utm_medium=cpc&utm_campaign=prolece2026`  
   Za Facebook isto, ali sa **utm_source=facebook**. Kampanju možeš menjati po želji.
2. **Leads by Source:** Napravi Google Sheet sa kolonama (date, email, phone, name, source_tag, utm_source, utm_medium, utm_campaign, affiliate_code). Zatim ili **(A)** Make webhook → Add row u taj Sheet + u Vercel dodaj `LEADS_SOURCE_WEBHOOK_URL`, ili **(B)** direktan upis preko `LEADS_SHEET_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON`. Redeploy.
3. **Test:** Otvori `?utm_source=instagram`, pošalji lead → u Sheetu proveri **source_tag** i **utm_source**.

Kad to uradiš, u Leads by Source Sheetu (ili u GHL ako mapiraš polja) moći ćeš da vidiš da li je lead došao sa Instagram reklame, Facebook reklame ili direktno sa sajta.
