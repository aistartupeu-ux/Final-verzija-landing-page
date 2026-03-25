# GHL WhatsApp Nurture Workflow — kompletan vodič

Ovaj vodič obuhvata **sve** — od potrebnih addon-ova i setap-a broja, do kreiranja WhatsApp nurture workflow-a u GoHighLevel. Praćenje je pogodno i za potpune početnike.

---

# DEO 0 — Šta ti sve treba pre workflow-a (addon-ovi, broj, Meta)

Pre nego što možeš da kreiraš WhatsApp nurture workflow, moraš imati podešen:

- GHL pretplatu sa WhatsApp addon-om
- Meta (Facebook) Business Manager
- WhatsApp Business Account (WABA)
- Broj telefona — novi ili postojeći (opisano ispod)

---

## 0.1 GHL pretplata i WhatsApp — gde da ga nađeš

**Važno: Native GHL WhatsApp nije u App Marketplace-u.**

U **App Marketplace** vidiš samo **treće strane** integracije (GREEN-API, WAGHL, Wassenger, itd.). To nije zvanični GHL WhatsApp.

**GHL WhatsApp (zvanični)** je ugrađen u platformu i nalazi se ovde:

1. Uloguj se u GHL.
2. Klikni **Settings** (ikona zupčanika).
3. U levom meniju traži **WhatsApp** ili **Phone** → **WhatsApp**.
4. Trebalo bi da vidiš stranicu **WhatsApp Settings** sa opcijom **Buy WhatsApp** / **Subscribe**.

Ako u Settings → WhatsApp ne vidiš opciju za kupovinu — tvoj plan možda ne uključuje (proveri Billing) ili si u sub-account-u (probaj **Switch to Agency View** pa Settings).

---

**Šta ti treba:**

| Šta | Obavezno? | Napomena |
|-----|-----------|----------|
| **GHL plan** (Agency/Unlimited) | Da | Conversations/Phone obično uključeni |
| **WhatsApp** (native GHL) | Da | ~29.99 USD/mesec. Kupuje se u **Settings → WhatsApp**, ne u Marketplace. |
| **Stripe (za agency)** | Opciono | Ako reselluješ; inače naplata na agency karticu |

---

**Ako native WhatsApp nije dostupan — treće strane opcije (App Marketplace):**

Ako u Settings nemaš WhatsApp opciju, možeš koristiti treće strane app-ove iz Marketplace-a, npr.:
- **WAGHL WhatsApp** — "Most Advanced and Affordable WhatsApp Solution for GHL"
- **WhatsApp Connector** (Whizz Solutions) — "Replace SMS with WhatsApp"
- **Wassenger** — "Automate WhatsApp Messaging"

Svaki ima svoj pricing i setup — prati njihove uputstva. Workflow logika (Contact Created → If/Else → Send Message) ostaje ista; samo kanal (WhatsApp) dolazi od treće strane umesto od GHL-a.

---

## 0.2 Meta (Facebook) Business Manager

WhatsApp Business koristi Meta infrastrukturu. Moraš imati:

- **Facebook nalog** — lični ili biznis
- **Meta Business Manager** — [business.facebook.com](https://business.facebook.com)
  - Ako nemaš: Create Account → unesi naziv firme, svoj email, itd.
- **WhatsApp Business Account (WABA)** — kreiraćeš ga tokom setap-a u GHL-u

Bez ovoga ne možeš registrovati broj na WhatsApp Business.

---

## 0.3 Broj telefona — tri opcije

### Opcija A: Kupi novi broj u GHL-u (najjednostavnije)

1. GHL → **Phone Numbers** (ili **Settings** → **Phone** → **Numbers**).
2. Klikni **Add Number** / **Buy Number**.
3. Izaberi državu, grad/regiju, izaberi broj iz liste.
4. Klikni **Proceed to Buy** / **Purchase**.
5. Broj će biti LeadConnector/Twilio broj — spreman za WhatsApp.

**Napomena:** Broj može imati samo **Voice** (pozivi) ili **Voice + SMS**. Za WhatsApp verifikaciju Meta šalje OTP preko poziva ili SMS-a. Ako broj ima samo Voice, moraš podesiti **call forwarding** na broj na koji možeš primiti poziv (vidi 0.5).

---

### Opcija B: Već imaš Twilio broj — import u GHL

Ako broj već postoji u **Twilio** nalogu (tvojem ili nekog drugog):

1. **Proveri da li je broj u Twilio** — uloguj se na [twilio.com](https://twilio.com) i pogledaj Phone Numbers.
2. **Nabavi Gaining Account SID** iz GHL-a:
   - GHL → klikni ime sub-account (gore levo) → **Switch to Agency View**
   - **Settings** → **Phone Integration**
   - **Sub Account Settings** → ikona olovke pored sub-account-a
   - Kopiraj **Account SID** (to je "Gaining SID")
3. **Kontaktiraj Twilio Support** (ili GHL Support) sa zahtevom za prenos broja:
   - Phone Number(s) koje prenosiš
   - Losing Account SID (Twilio account koji sada drži broj)
   - Gaining Account SID (iz koraka 2)
   - Rok kada ti treba prenos
4. Kad Twilio prebaci broj u GHL Twilio sub-account, broj će se pojaviti u GHL-u u **Phone Numbers**.
5. Zatim ga možeš koristiti za WhatsApp (vidi 0.5).

**Napomena:** Oba vlasnika (Losing i Gaining) moraju odobriti prenos ako su različiti Twilio account-i.

---

### Opcija C: Imaš broj kod drugog providera (npr. mobilni, drugi VoIP)

1. **Port broj u Twilio** — Twilio podržava porting:
   - Twilio Console → Phone Numbers → Port a number
   - Prati Twilio uputstva (LOA, invoice, itd.)
2. Kad broj bude u Twilio, koristi **Opciju B** da ga importuješ u GHL.
3. Alternativno — **GHL Support**: otvori ticket za "port number to LeadConnector" i priloži regulatory detalje. GHL može da pomogne u portingu u određenim slučajevima.

---

## 0.4 Gde da upišeš / povežeš broj koji već imaš

**"Mogu li da upišem svoj postojeći broj?"** — Da, ali ne u proizvoljno polje. Broj mora biti u GHL **Phone Numbers** (kupljen ili importovan), pa ga zatim povežeš sa WhatsApp-om. Tok je:

1. Broj mora biti **u GHL Phone Numbers** (kupljen ili importovan — vidi 0.3).
2. Zatim ga registruješ na **WhatsApp** preko GHL Settings → WhatsApp (vidi 0.5).
3. Kad je WhatsApp povezan, broj se koristi u **Conversations** i u workflow-ima (Send Message → izabereš kanal WhatsApp).

Dakle: prvo broj u Phone Numbers, pa WhatsApp setup sa tim brojem.

---

## 0.5 WhatsApp setup u GHL-u — korak po korak

**Preduslov:** Imaš broj u GHL (Opcija A ili B iz 0.3) i Meta Business Manager (0.2).

### Korak 1: Call forwarding (ako broj ima samo Voice)

Ako si kupio broj koji podržava samo pozive:

1. **Phone Numbers** → izaberi svoj broj → **Settings** ili **Edit**.
2. Nađi **Call Forwarding** — postavi forwarding na broj na koji možeš primiti poziv (mobilni).
3. Meta će na taj način poslati OTP pozivom na tvoj broj tokom WhatsApp registracije.

### Korak 2: Pokretanje WhatsApp setap-a

1. GHL → **Settings** → **WhatsApp** (ili **Phone** → **WhatsApp**).
2. Klikni **Buy WhatsApp** (ako već nisi) ili **Set up WhatsApp**.
3. Klikni **Sign up with Facebook**.
4. Uloguj se u Facebook nalog.
5. Klikni **Get started**.
6. Popuni business informacije:
   - Business Portfolio
   - Business Name
   - Website ili profile page
   - Country
7. **Create or Select** WhatsApp Business Account.
8. Kreiraj **WhatsApp Business Profile**:
   - Account name
   - Display name (šta vide korisnici)
   - Category (npr. Education, Business)
9. **Unesi broj** — izaberi LC/Twilio broj koji si kupio ili importovao (iz liste u GHL-u).
10. **Verifikacija:** Meta šalje OTP:
    - **Phone** — ako broj ima samo Voice; OTP stiže pozivom (zato call forwarding).
    - **SMS** — ako broj podržava SMS; kod može stići u GHL **Conversations** (LeadConnector app).
11. Unesi kod koji si dobio.
12. **Review Permissions** → potvrdi.
13. WhatsApp je povezan.

**Ako dobiješ grešku "number is registered to existing WhatsApp account":** Broj je verovatno već na WhatsApp-u (npr. na tvom telefonu). Moraš da obrišeš taj WhatsApp nalog sa broja ili da koristiš drugi broj. Meta ima vodič za [migraciju broja na Business Account](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/migrate-existing-whatsapp-number-to-business-account).

---

## 0.6 Provera da sve radi

1. **Settings** → **WhatsApp** — trebalo bi da vidiš status "Connected" ili slično.
2. **Conversations** — da li možeš da otvoriš inbox i da vidiš WhatsApp kanal.
3. Ručno pošalji test poruku sebi — da potvrdiš da poruke stižu.

Kad ovo radi — možeš da kreiraš workflow (Deo 1 i dalje).

---

## 0.7 Rezime — checklist pre workflow-a

- [ ] GHL plan uključuje Phone/Conversations
- [ ] WhatsApp addon kupljen (~29.99 USD/mesec)
- [ ] Meta Business Manager kreiran
- [ ] Broj u GHL-u: kupljen (Opcija A) ili importovan (Opcija B)
- [ ] Call forwarding podešen (ako broj ima samo Voice)
- [ ] WhatsApp setup završen (Settings → WhatsApp → povezan)
- [ ] Test poruka poslata i primljena

---

## Pregled workflow koraka — šta radiš u Delovima 1–10

| # | Ekran / Korak | Šta vidiš |
|---|---------------|-----------|
| 1 | Create Workflow | Unos naziva workflow-a |
| 2 | Add Trigger | **Contact Created** — padajuća lista, WORKFLOW TRIGGER NAME, + Add filters, Save Trigger |
| 3 | Add If/Else | Contact → Phone → is not empty; Yes / No grane |
| 4 | Send WhatsApp (1) | To: merge field Phone; Message: tekst poruke |
| 5 | Wait | Duration: 2, Days |
| 6 | Send WhatsApp (2) | Isto; druga poruka |
| 7 | Wait | 3 Days |
| 8 | … | Ponavljaj Send WhatsApp + Wait za ostale poruke |
| 9 | Activate | Uključi workflow |

---

# DEO 1 — Kreiranje workflow-a

---

## Korak 1.1: Ulazak u Workflows

1. Otvori browser i uloguj se na **GoHighLevel** (app.gohighlevel.com ili tvoja white-label domena).
2. U levom meniju potraži **Automation** (ili **Marketing** → **Automation**).
3. Klikni na **Workflows**.
4. Videćeš listu postojećih workflow-ova (npr. tvoj Welcome workflow koji prima leadove sa sajta).

**Šta je workflow?**  
Workflow je niz automatskih koraka koje GHL izvršava kada se desi određeni događaj (npr. novi lead). Nurture workflow = automatske WhatsApp poruke u vremenskim razmacima.

---

## Korak 1.2: Kreiranje novog workflow-a

1. U gornjem desnom uglu klikni **+ Create Workflow** (ili **+ New Workflow**).
2. Pojaviće se prazan workflow ili dijalog za naziv.
3. Unesi naziv, npr: **WhatsApp Nurture — Novi leadovi**
4. Ako te pita za **Location/Sub-Account**, izaberi onu u kojoj radiš (gde su tvoji leadovi).

**Zašto dobar naziv?**  
Kasnije ćeš imati više workflow-ova. Jasni nazivi pomažu da brzo nađeš šta šta radi.

---

## Korak 1.3: Prazan workflow

Nakon kreiranja videćeš:
- Praznu ploču (canvas) sa jednim blokom ili
- Poruku tipa "Add a trigger to get started"

To je normalno. Sledeći korak je dodavanje **triggera** — šta pokreće workflow.

---

# DEO 2 — Trigger (šta pokreće workflow)

---

## Korak 2.1: Šta je trigger?

**Trigger** = događaj koji pokreće workflow. Npr. "kad neko unese email na sajtu" ili "kad se doda novi kontakt".  
Bez triggera workflow nikad ne bi krenuo.

Za nurture imaš dve glavne opcije:

---

## Korak 2.2: Opcija A — Contact Created (preporučeno, uvek dostupan)

**Ideja:** Svaki novi kontakt koji se pojavi u GHL-u automatski ulazi u nurture. Ovaj trigger **postoji u svim GHL verzijama**.

**Tačno šta vidiš na ekranu:**

Otvoriće se prozor sa naslovom **"Contact Created"** na vrhu. Ispod je kratak tekst: *"Activates the moment a new Contact record is added."* (Okida se u trenutku kada se doda novi kontakt.)

- **CHOOSE A WORKFLOW TRIGGER** — padajuća lista (dropdown). Izaberi **Contact Created** (ako već nije izabrano).
- **WORKFLOW TRIGGER NAME** — polje za naziv. Možeš ostaviti **Contact Created** ili uneti npr. "Novi lead — WhatsApp nurture".
- **+ Add filters** — link za filtere. Za sada **ne dodavaj** filtere; svi novi kontakti će ulaziti. (Filter možeš dodati kasnije ako želiš samo određene — npr. samo ako imaju tag.)
- Na dnu desno: dugmad **Cancel** i **Save Trigger**.

**Koraci:**

1. U novom workflow-u klikni na **"+ Add Trigger"** ili na prazan trigger blok.
2. U padajućoj listi **CHOOSE A WORKFLOW TRIGGER** izaberi **Contact Created**.
3. U polju **WORKFLOW TRIGGER NAME** ostavi "Contact Created" ili upiši svoj naziv.
4. **Ne klikći** "+ Add filters" — ostavi bez filtera da svi novi leadovi uđu.
5. Klikni **Save Trigger**.

**Šta se dešava u praksi:**
- Neko unese email na sajtu → sajt šalje podatke u GHL webhook.
- Welcome workflow kreira kontakt u GHL-u.
- **Kontakt Created** trigger se automatski okida → ovaj Nurture workflow kreće za tog kontakta.
- Istovremeno Welcome workflow šalje welcome email. Nurture šalje WhatsApp sekvencu.

**Prednost:** Ne diraš Welcome workflow. Jednostavno, sve radi automatski.

---

## Korak 2.3: Opcija B — Contact Added to Workflow (ako imaš u svom GHL-u)

**Napomena:** Ovaj trigger **ne postoji u svim GHL planovima/verzijama**. Ako ga ne vidiš u listi — preskoči ovu opciju i koristi **Contact Created** (Opcija A).

**Ideja:** Nurture se pokreće samo kada Welcome workflow eksplicitno doda kontakt u ovaj nurture (akcija "Add to Workflow").

**Koraci (ako trigger postoji):**

1. Klikni **"+ Add Trigger"**.
2. Traži **Contact Added to Workflow** ili **Workflow Enrollment** (naziv može varirati).
3. Polje **"Workflow"** — izaberi svoj Welcome workflow.
4. Klikni **Save**.

**Povezivanje:** U Welcome workflow dodaješ akciju **Add to Workflow** → izabereš ovaj Nurture workflow.

---

## Korak 2.4: Kako izgleda trigger blok posle Save

Kad klikneš **Save Trigger**, prozor se zatvori i videćeš workflow canvas (ploču).

- Prvi blok će biti **Contact Created** (ili naziv koji si uneo).
- Ispod/desno obično piše kratak opis: *"Activates the moment a new Contact record is added."*
- Od tog bloka kreće linija na dole — tu klikneš **"+"** da dodaš sledeći korak (If/Else).

Trigger je uvek **prvi** blok. Od njega kreće tok ka ostalim koracima.

---

# DEO 3 — Uslov: samo kontakti sa brojem telefona (If/Else)

---

## Korak 3.1: Zašto uslov?

WhatsApp poruke možeš poslati **samo na broj telefona**. Ako kontakt nema broj, WhatsApp akcija neće uspeti.  
Uslovom preskačeš takve kontakte ili ih vodiš u drugu granu (npr. email).

---

## Korak 3.2: Dodavanje If/Else bloka

U GHL-u se ovaj korak zove **If/Else** (ne "Condition").

1. Ispod **Contact Created** trigger bloka vidiš liniju ili **"+"** (plus). Klikni **"+"** da dodaš novi korak.
2. Otvoriće se meni sa kategorijama akcija. Traži **If/Else** (može biti u **Flow** ili **Logic**).
3. Izaberi **If/Else**.
4. Klikni **Add** ili **Select**.

---

## Korak 3.3: Podešavanje If/Else uslova

**Tačno šta vidiš na ekranu:**

Otvoriće se podešavanja za If/Else blok. Obično ima:

- Polja za uslov (možda **Add filter** ili **Add segment**):
  - **Field** — izaberi **Contact** → **Phone** (ili **Phone Number**, **Cell Phone**)
  - **Operator** — izaberi **Is Not Empty** (u GHL-u tačan naziv može biti "Is Not Empty" ili "Is Not Blank")
- Dve grane: **Yes** (uslov ispunjen) i **No** (uslov nije ispunjen)
- Dugme **Save** na dnu

**Koraci:**

1. Klikni **Add filter** / **Add segment** ili slično da dodaš uslov.
2. **Field:** Contact → Phone (ili Phone Number)
3. **Operator:** Is Not Empty
4. Klikni **Save**

**Šta ovo znači:**  
- **If Yes** (uslov ispunjen): kontakt ima broj → nastavlja se prema WhatsApp porukama.  
- **If No** (uslov nije ispunjen): nema broj → možeš ga pustiti da workflow završi ili da ide u granu "pošalji email umesto".

---

## Korak 3.4: Povezivanje grana

- Iz **Trigger** vodi linija ka **If/Else**.
- Iz **If/Else** vode dve linije: **Yes** i **No**.
- **Yes** granu poveži sa prvim **Send WhatsApp** korakom (klikni **"+"** na Yes grani).
- **No** granu: ostavi da završi (End) ili dodaj "Send Email" ako želiš da i oni nešto dobiju.

---

# DEO 4 — Sekvenca poruka (Send WhatsApp + Wait)

---

## Korak 4.1: Šta je sekvenca?

Sekvenca = niz poruka sa pauzama između.  
Bez pauza sve bi stiglo odjednom; sa pauzama lead dobija vrednost postepeno i ne oseća spam.

**Osnovna formula:**  
Poruka 1 → Čekaj 2 dana → Poruka 2 → Čekaj 3 dana → Poruka 3 → itd.

---

## Korak 4.2: Prva poruka — Send WhatsApp

1. Na **Yes** grani iz If/Else bloka klikni **"+"** da dodaš novi korak.
2. U meniju traži kategoriju **Conversations**, **SMS**, **WhatsApp** ili **Messages**.
3. Izaberi **Send Message**, **Send WhatsApp**, **Send SMS** (ako koristiš WhatsApp preko Conversations, obično je "Send Message" sa izborom kanala).
4. Klikni **Add** ili **Select**.

---

## Korak 4.3: Podešavanje prve poruke

**Tačno šta vidiš na ekranu:**

Otvoriće se podešavanja za Send Message. Obično ima:

- **Action name** — npr. "WhatsApp — Prva poruka"
- **To / Recipient / Phone Number** — polje za primaoca. Klikni na ikonu merge field (često `{ }` ili "Insert merge field") i izaberi **Contact → Phone** (ili **Contact's Phone Number**).
- **Message / Body / Content** — veliko polje za tekst poruke. Ovde pišeš sadržaj.
- **Channel** — ako ima izbor (SMS / WhatsApp / Email), izaberi **WhatsApp**.
- Dugme **Save**

**Koraci:**

1. **To / Recipient:**  
   - Klikni na polje i izaberi **Merge field** (ili Contact field).  
   - Izaberi **Contact's Phone Number** (ili `{{contact.phone}}`).  
   - Ovo šalje poruku na broj tog kontakta.

2. **Message / Body:**  
   - Napiši tekst poruke. Možeš koristiti emoji.
   - Primer:
   ```
   Zdravo! 👋

   Hvala što si se prijavio/la na AI Hype Academy.

   U narednih nekoliko dana ću ti slati korisne savete i informacije o kursu. Ostani uključen/na!

   Pozdrav,
   [Tvoje ime]
   ```

3. **Merge fields (opciono):**  
   - Ako imaš ime u kontaktu, možeš koristiti `{{contact.first_name}}` na početku: "Zdravo {{contact.first_name}}!"
   - Ako polje ne postoji, GHL može ostaviti prazno ili placeholder.

4. Klikni **Save**.

---

## Korak 4.4: Wait (Delay) — čekanje pre sledeće poruke

1. Ispod **Send WhatsApp** bloka klikni **"+"**.
2. U meniju traži **Flow**, **Time**, **Wait** ili **Delay**.
3. Izaberi **Wait**, **Delay** ili **Pause**.
4. Klikni **Add** ili **Select**.

**Tačno šta vidiš na ekranu:**

- **Action name** — npr. "Čekaj 2 dana"
- **Duration / Wait for** — obično ima dva polja:
  - Broj: npr. **2**
  - Jedinica: **Days** / **Hours** / **Minutes** (iz padajuće liste)
- **Wait until specific time (opciono)** — npr. "Until 10:00 AM" da poruka stigne ujutru
- Dugme **Save**

**Koraci:**

1. U polju za broj upiši **2**.
2. U polju za jedinicu izaberi **Days**.
3. (Opciono) Uključi "Wait until" i izaberi vreme npr. 10:00.
4. Klikni **Save**.

---

## Korak 4.5: Druga poruka

1. Ispod **Wait** bloka klikni **"+"**.
2. Ponovo dodaj **Send WhatsApp**.
3. Podesi:
   - **To:** Contact's Phone Number.
   - **Message:** npr.
   ```
   Evo jednog brzog saveta iz AI sveta 🚀

   [Kratki koristan sadržaj — 2-3 rečenice]

   Imaš pitanja? Slobodno odgovori na ovu poruku.
   ```
4. Snimi.

---

## Korak 4.6: Ponavljanje — Wait + Send WhatsApp

Nastavi isti obrazac za treću, četvrtu, petu poruku:
- **Wait** (npr. 3–4 dana)
- **Send WhatsApp** (nova poruka)

**Preporučeni raspored (5 poruka u ~2 nedelje):**

| Redni broj | Šta | Tekst (primer) |
|------------|-----|----------------|
| 1 | Send WhatsApp | Zahvala + šta sledi |
| 2 | Wait | 2 dana |
| 3 | Send WhatsApp | Savet ili vrednost |
| 4 | Wait | 3 dana |
| 5 | Send WhatsApp | Pitanje ili soft CTA ("Imaš pitanja?") |
| 6 | Wait | 4 dana |
| 7 | Send WhatsApp | Reminder (prijava/giveaway) |
| 8 | Wait | 3 dana |
| 9 | Send WhatsApp | Finalni CTA (link, poslednja šansa) |

Broj poruka i delay možeš prilagoditi; navedeni primer je dobar početak.

---

## Korak 4.7: Kako izgleda ceo lanac

U workflow-u bi trebalo da vidiš nešto ovako (shematski):

```
[Trigger] → [If/Else: Phone not empty?]
                  │
            Yes   │   No
                  │    └→ (End ili Send Email)
                  ▼
            [Send WhatsApp 1] → [Wait 2 days] → [Send WhatsApp 2] → [Wait 3 days] → ... → [Send WhatsApp 5]
```

Svaki blok je povezan linijom sa sledećim. Ako nešto nije povezano, GHL će možda prijaviti upozorenje.

---

# DEO 5 — Merge fields i personalizacija

---

## Korak 5.1: Šta su merge fields?

**Merge fields** = placeholderi koje GHL zamenjuje stvarnim podacima iz kontakta.  
Npr. `{{contact.first_name}}` postaje "Marko" ako je to ime kontakta.

---

## Korak 5.2: Najčešći merge fields

| Merge field | Šta vraća |
|-------------|-----------|
| `{{contact.first_name}}` | Ime |
| `{{contact.last_name}}` | Prezime |
| `{{contact.email}}` | Email |
| `{{contact.phone}}` | Broj telefona |
| `{{company.name}}` | Naziv kompanije (iz GHL podešavanja) |
| `{{custom_field.naziv_polja}}` | Vrednost custom polja (npr. affiliate_code) |

**Kako ih koristiti:**  
U polju za poruku klikni na ikonu za merge fields (često `{ }`) i izaberi željeno polje.

---

## Korak 5.3: Ako nemaš ime (firstName prazno)

Na sajtu trenutno ne šalješ ime u GHL; moguće da kontakt nema firstName. U tom slučaju:
- `{{contact.first_name}}` može biti prazan.
- Možeš pisati "Zdravo!" bez imena, ili "Pozdrav," da bude neutralno.

---

# DEO 6 — Završetak i Add Tag (opciono)

---

## Korak 6.1: Kraj workflow-a

Kada kontakt prođe kroz sve korake (sve poruke poslate), workflow automatski se završava za njega. Ne moraš dodavati poseban "End" blok.

---

## Korak 6.2: Tag "nurture_completed" (opciono)

Ako želiš da vidiš ko je prošao ceo nurture:

1. Posle poslednje **Send WhatsApp** bloka dodaj **"+"**.
2. Traži **Contact** → **Add Tag**.
3. Kreiraj tag, npr: **nurture_completed**.
4. Snimi.

Tako možeš u GHL-u filtrirati kontakte po tom tagu (npr. u kampanjama ili pri ručnom pregledu).

---

# DEO 7 — Povezivanje sa Welcome workflow-om

---

## Korak 7.1: Da li ti uopšte treba ovaj korak?

**Ako si koristio trigger Contact Created (Opcija A):**  
**NE.** Nurture se automatski pokreće za svakog novog kontakta. Welcome workflow kreira kontakt → Contact Created trigger odmah pokreće Nurture. Ništa ne moraš da povezuješ.

**Preskoči ceo Deo 7** i idi na Deo 8 (Aktivacija i testiranje).

---

## Korak 7.2: Kada jeste potrebno?

Samo ako si koristio **Contact Added to Workflow** (Opcija B) — a taj trigger postoji u tvom GHL-u. U tom slučaju moraš ručno da povežeš Welcome i Nurture.

---

## Korak 7.3: Otvaranje Welcome workflow-a

1. Idi u **Automation** → **Workflows**.
2. Otvori workflow koji prima webhook sa sajta (obično "Welcome", "Lead Webhook").
3. U njemu bi trebalo: **Webhook trigger** → **Create Contact** → **Send Email** (welcome).

---

## Korak 7.4: Dodavanje "Add to Workflow"

1. Nađi mesto **posle** Create Contact i Send Email.
2. Klikni **"+"** na liniji.
3. Traži **Flow** ili **Add to Workflow** (može biti i "Enroll in Workflow").
4. Izaberi **Add to Workflow**.
5. U polju **Workflow** izaberi **WhatsApp Nurture**.
6. Klikni **Save**.

**Tok:** Welcome kreira kontakt → šalje email → **Add to Workflow** → Nurture workflow kreće.

---

## Korak 7.5: Aktivacija Welcome workflow-a

Proveri da je Welcome workflow **Active**. Ako je pauziran, uključi ga.

---

# DEO 8 — Aktivacija i testiranje

---

## Korak 8.1: Aktivacija Nurture workflow-a

**Tačno šta vidiš:**

Na vrhu workflow stranice obično ima:
- Naziv workflow-a (npr. "WhatsApp Nurture — Novi leadovi")
- Status: **Draft** (crveno/sivo) ili **Active** (zeleno)
- Dugme **Activate** / **Turn On** / **Publish** u gornjem desnom uglu

**Koraci:**

1. Proveri da workflow nije već **Active** (onda je već uključen).
2. Ako je **Draft**, klikni **Activate** ili **Turn On**.
3. Može da se pojavi potvrda — potvrdi da želiš da uključiš workflow.

---

## Korak 8.2: Testiranje sa pravim leadom

1. Otvori sajt u incognito prozoru.
2. Unesi **svoj pravi email i broj telefona** u formu.
3. Pošalji formu.
4. Proveri:
   - Da li je kontakt kreiran u GHL (Contacts).
   - Da li je ušao u Nurture workflow (Automation → Workflows → tvoj Nurture → proveri "Contacts in workflow" ili slično).
   - Da li ti je stigla prva WhatsApp poruka.

---

## Korak 8.3: Testiranje iz GHL-a (opciono)

Ako GHL ima opciju **Test workflow** ili **Run test**:
1. Klikni na nju.
2. Izaberi test kontakt (npr. sebe) koji ima broj.
3. Pokreni test i proveri da li poruke stižu.

---

## Korak 8.4: Format broja telefona

WhatsApp zahteva broj u **E.164** formatu, npr: **+381612345678** (zemlja + broj bez vodećih nula).  
Tvoja forma na sajtu koristi `react-phone-number-input` koji bi trebalo da to automatski formatira. Proveri u GHL-u da kontakt ima broj sa **+**.

---

# DEO 9 — Retargeting za budući giveaway

---

## Korak 9.1: Ideja

Isti Nurture workflow možeš koristiti i za ljude koje ručno ili automatski označiš za retargeting (npr. za giveaway). Umesto da kreiraš novu sekvencu, samo ih dodaš u postojeći nurture.

---

## Korak 9.2: Novi workflow "Giveaway Retargeting"

1. **Automation** → **Workflows** → **+ Create Workflow**.
2. Naziv: **Giveaway Retargeting**.
3. **Trigger:** **Tag Added**.
4. Podesi tag: npr. **giveaway_2025** (ili šta želiš).

---

## Korak 9.3: Jedina akcija — Add to Workflow

1. Dodaj akciju **Add to Workflow**.
2. Izaberi **WhatsApp Nurture** workflow.
3. Snimi i aktiviraj.

---

## Korak 9.4: Kako koristiti

- Ručno: otvoriš kontakt u GHL-u, dodaš tag **giveaway_2025** → kontakt ulazi u Nurture.
- Automatski: u nekom drugom workflow-u dodaješ akciju **Add Tag** (npr. kada neko klikne link u email-u) → Tag Added pokreće Giveaway Retargeting → Add to Workflow → isti Nurture.

---

# DEO 10 — Rezime i checklist

---

## Checklist pre aktivacije

- [ ] Trigger je podešen (**Contact Created**).
- [ ] If/Else: Phone Is Not Empty (Yes grana → WhatsApp, No → End).
- [ ] Sve Send WhatsApp poruke imaju **To:** Contact's Phone Number.
- [ ] Između poruka ima **Wait** blokove (2–4 dana).
- [ ] Nurture workflow je **Active**.
- [ ] Welcome workflow je **Active** (kreira kontakte sa sajta).
- [ ] Test lead sa pravim brojem prima poruke.

---

## Struktura (kratak pregled)

| Redosled | Tip bloka | Šta radi |
|----------|-----------|----------|
| 1 | Trigger | **Contact Created** — svaki novi kontakt |
| 2 | If/Else | Proveri da li kontakt ima broj (Phone Is Not Empty) |
| 3 | Send WhatsApp | Prva poruka |
| 4 | Wait | 2 dana |
| 5 | Send WhatsApp | Druga poruka |
| 6 | Wait | 3 dana |
| 7 | Send WhatsApp | Treća poruka |
| 8 | Wait | 4 dana |
| 9 | Send WhatsApp | Četvrta poruka |
| 10 | Wait | 3 dana |
| 11 | Send WhatsApp | Peta poruka |
| 12 | Add Tag (opciono) | nurture_completed |

---

## Napomena o WhatsApp u GHL-u

- GHL koristi **Conversations** modul za WhatsApp.
- Može da ti treba podešavanje **WhatsApp Business API** (Twilio ili drugi provider) ako još nisi povezao broj.
- Proveri u GHL **Settings** → **Conversations** / **Phone** da li je WhatsApp omogućen i da li broj radi.

---

Ako neki korak u tvom GHL-u izgleda drugačije (drugačiji meni, druga imena), napiši koji tačno korak i šta vidiš — mogu prilagoditi vodič.
