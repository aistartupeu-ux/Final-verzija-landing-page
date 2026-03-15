# GoHighLevel leads — detaljno objašnjenje

Zašto su neka polja prazna, kako da vidiš affiliate_code, tagovi, i šta sve treba da podesiš.

---

## 1. Zašto su Contact name, Phone i Business name prazni?

### 1.1 Kako podaci stižu u GHL

Kada neko submit-uje formu na sajtu, sajt šalje POST request na tvoj GHL webhook. U tom request-u su samo polja koja forma **zapravo šalje**.

Tvoj sajt ima **nekoliko formi**:

| Forma | Gde je | Šta šalje |
|-------|--------|-----------|
| **EmailForm** | Hero, CTA, HowToEnter, FinalCTA | `email`, `phone` (opciono) |
| **Join stranica** | /join | `email`, `name`, `phone` (prazno) |
| **Special gate** | /special | `email`, `phone` |

### 1.2 Contact name — zašto je prazno (?)

**EmailForm** (glavna forma na početnoj stranici) ima dva koraka:
1. Korak 1: unese **email** → klik "Join The Hype"
2. Korak 2: unese **phone** (ili klikne "Preskoči")

Forma **ne pita za ime**. Zato se u API šalje samo:
```json
{ "email": "korisnik@example.com", "phone": "+381..." }
```
Ili, ako je preskočio telefon:
```json
{ "email": "korisnik@example.com", "phone": null }
```

**`name` se nigde ne šalje** iz EmailForm.

GHL kontakt mora da ima nešto za "Contact name". Pošto `firstName` i `lastName` nisu poslati, GHL prikazuje `? -` kao placeholder — "nepoznata osoba".

**Kako da imaš ime:** Trebalo bi da u EmailForm dodaš polje za ime (npr. opciono) i da ga šalješ u `/api/leads`. Onda GHL workflow mapira `firstName` iz webhook-a i ime će se pojaviti.

---

### 1.3 Phone — zašto je prazno

Na drugom koraku EmailForm korisnik može:
- Uneti broj telefona i kliknuti "Završi" → phone se šalje
- Kliknuti **"Preskoči"** → phone se ne šalje (šalje se `null`)

Ako je većina ljudi preskočila telefon, u GHL će imati prazno polje Phone. To je namerno — telefon je opciono.

---

### 1.4 Business name — zašto je prazno

Polje "Business name" **nije deo niti jedne forme** na sajtu. Zato je uvek prazno. To polje služi za B2B kontakte; za waitlist kursa obično nije potrebno.

---

## 2. Zašto ne vidiš affiliate_code u tabeli?

### 2.1 Razlika: Tag vs Custom Field

U GHL postoje:
- **Tagovi** — npr. `welcome_sent`, `src:affiliate`. Prikazuju se u koloni "Tags".
- **Custom fields** — dodatna polja koja ti kreiraš, npr. `affiliate_code`, `utm_source`.

`affiliate_code` je **custom field**. Čak i ako je ispravno mapiran i upisan na kontakt, **neće se sam pojaviti** u tabeli Contacts ako ga nisi dodao u prikaz kolona.

### 2.2 Kako GHL prikazuje kolone

GHL ima puno kolona (Email, Phone, Tags, Custom fields...). Po default-u prikazuje samo neke. Ostale moraš ručno dodati.

**Korak po korak — kako da dodaš kolonu affiliate_code:**

1. Idi u **Contacts** (levi meni u GHL)
2. Nađi deo iznad tabele gde piše "Columns" ili ima ikonu za podešavanje kolona (često tri linije ili strelica)
3. Klikni na **"Columns"** / **"Customize columns"** / **"Manage columns"** / ikonu **⋮** pored naslova kolona
4. Otvoriće se lista svih dostupnih kolona. Skroluj ili pretražuj
5. Nađi **"affiliate_code"** (može biti u sekciji "Custom Fields")
6. **Uključi ga** (checkbox ili toggle) da bi se prikazao u tabeli
7. Možda možeš da pomeriš redosled — stavi ga blizu Email ili Tags
8. Klikni **Save** / **Apply** / **Done**

Sada bi u tabeli trebalo da vidiš kolonu **affiliate_code**. Za leadove koji su došli preko affiliate linka videćeš vrednost (npr. `DAMIJAN123`). Za ostale biće prazno.

### 2.3 Ako i dalje ne vidiš affiliate_code

Proveri:
1. Da li custom field **affiliate_code** uopšte postoji (Settings → Custom Fields)
2. Da li je u workflow **Create Contact** akciji mapirano polje `affiliate_code` iz webhook payload-a
3. Da li si testirao sa affiliate linkom (`?ref=DAMIJAN123`) — inače webhook ne šalje affiliate_code

---

## 3. Tag welcome_sent vs src:affiliate

### 3.1 welcome_sent

Tag **welcome_sent** dolazi iz tvog workflow-a — verovatno ga dodaje akcija "Add Tag" posle slanja welcome email-a. To znači da je welcome email uspešno poslat. Taj tag **se vidi** i sve je u redu.

### 3.2 src:affiliate

Tag **src:affiliate** bi trebalo da označi leadove koji su došli preko affiliate linka. Po default-u **tvoj workflow ga verovatno ne dodaje**. Radimo samo Create Contact + Send Email. Tag `src:affiliate` mora ručno da se doda u workflow.

**Zašto je koristan:** Možeš filterovati kontakte po tagu (npr. prikaži sve sa `src:affiliate`) ili slati posebne kampanje samo affiliate leadovima.

**Kako da ga dodaš:**

1. Otvori workflow koji prima leadove (Inbound Webhook → Create Contact → Send Email)
2. Posle **Create Contact** dodaj novu akciju: **Add Tag**
3. U podešavanjima Add Tag:
   - Tag: `src:affiliate` (kreiraj ga ako ne postoji)
   - **Uslov (Filter):** dodaj filter da se akcija izvrši **samo ako** `affiliate_code` nije prazan
     - U GHL to može biti "Conditional path" ili "Filter" pre Add Tag
     - Uslov: `affiliate_code` is not empty / is not equal to ""
4. Sačuvaj workflow

Ako nemaš uslov, svim leadovima bi se dodao tag `src:affiliate`, što nije tačno. Zato je filter bitan.

**Bez ovoga:** affiliate_code će i dalje biti upisan u custom field. Tag je samo za lakše filtriranje i segmentaciju.

---

## 4. Da li treba da "umrežiš" tabele?

### 4.1 Šta to znači

"Umrežavanje tabela" obično znači da nešto iz jedne tabele (npr. Google Sheet) automatski utiče na drugu (npr. GHL kontakte), ili obrnuto.

### 4.2 Tvoj tok

1. Korisnik submit-uje formu na sajtu
2. Sajt šalje podatke na **GHL webhook** (jedan HTTP request)
3. GHL workflow primi podatke i **Create Contact** ih upisuje u CRM
4. Sve se dešava u jednom request-u — nema "dve tabele" koje treba da se povežu

Google Sheet (AHA_Affiliate_System) koristi **Make.com** — Make prima affiliate click/lead evente od sajta i upisuje ih u Sheet. To je **odvojen tok** od GHL. GHL ne čita iz Sheet-a. Sheet je za tvoju evidenciju i reporting, GHL je za CRM i email kampanje.

**Zaključak:** Ne moraš ništa da umrežavaš. GHL dobija podatke direktno iz webhook-a. Sheet dobija podatke iz Make webhook-a.

### 4.3 Šta mora da bude povezano

- **Sajt → GHL:** Već je povezano preko `GHL_WEBHOOK_URL`. Kad forma submit-uje, sajt šalje na taj URL.
- **Sajt → Make:** Povezano preko `MAKE_WEBHOOK_URL`. Kad ima affiliate ref, sajt šalje click/lead na Make.
- **Make → Google Sheet:** U Make scenariju mora da postoji akcija "Add a row" u Sheet. To si već podesio u scenariju.

Nema dodatnih "linkova" koje treba da praviš između GHL i Sheet-a.

---

## 5. Kratak checklist (sažetak)

| Šta | Gde | Akcija |
|-----|-----|--------|
| Kolona affiliate_code | GHL → Contacts → Columns | Dodaj custom field affiliate_code u prikaz kolona |
| Mapiranje affiliate_code | GHL → Workflow → Create Contact | Mapiraj iz webhook triggera (vidi AFFILIATE_MAPIRANJE_GHL.md) |
| Tag src:affiliate | GHL → Workflow | (Opciono) Add Tag sa filterom "affiliate_code not empty" |
| Ime kontakta | Sajt (EmailForm) | (Opciono) Dodaj polje za ime i šalji u /api/leads |

---

## 6. Za napred: kako da dodaš ime u EmailForm

Ako želiš da Contact name nije prazan:

1. U EmailForm dodaj polje za ime (npr. opciono, pre ili posle emaila)
2. U submit payload-u dodaj `name: "Ime Prezime"`
3. U `/api/leads` već se šalje `firstName` i `lastName` iz `name` — samo treba da forma pošalje `name`

Trenutno EmailForm šalje samo `{ email, phone }`. Trebalo bi da dodaš `name` u body i da ga čitaš iz state-a forme.
