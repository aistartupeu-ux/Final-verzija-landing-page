# GoHighLevel — kompletan vodič za affiliate (za potpune početnike)

Ovaj vodič objašnjava **šta je GoHighLevel u ovom kontekstu**, **zašto** nešto radimo i **tačno šta da klikneš i šta da upišeš** u svakom koraku. Cilj je da i totalni početnik može da podesi da se u GHL-u vidi ko je doveo koji lead (affiliate kod).

---

## Šta je GoHighLevel (GHL) i šta mi radimo

**GoHighLevel** je CRM i alat za automatizaciju (email, SMS, workflow-i). Tvoj sajt **već šalje** svakog leada (čoveka koji unese email na formi) u GHL preko tzv. **webhook-a** — to je poseban URL koji GHL da tebi, a ti ga staviš u Vercel. Kad neko pošalje formu, sajt pozove taj URL i prosledi podatke: email, ime, telefon, i — ako je došao preko affiliate linka — **affiliate_code** (npr. DAMIJAN123).

**Šta želimo da postignemo:**  
Da u GHL-u na svakom **kontaktu** (lead-u) bude upisano **ko ga je doveo** — tj. da se u kontaktu vidi polje **affiliate_code** sa vrednošću (npr. DAMIJAN123). Da bi to radilo, u GHL-u moramo:

1. Kreirati **custom polje** (polje po imenu `affiliate_code`) na Contact-u.
2. U **workflow-u** koji prima taj webhook reći: „kad stigne webhook, u Create Contact akciji u polje affiliate_code upiši vrednost iz webhook-a“.

Posle toga kad otvoriš bilo koji kontakt u GHL-u, moći ćeš da vidiš da li je došao od affiliate-a i koji je kod.

---

## Šta ti treba pre nego što kreneš

- Nalog u **GoHighLevel** (app.gohighlevel.com ili tvoja white-label domena).
- **Location** (sub-nalog) izabran — onaj u kome vodiš AI Hype Academy leadove.
- Znaj da ćeš u Vercel-u koristiti jedan **webhook URL** iz GHL-a (ako već imaš workflow koji prima leadove, taj URL već koristiš kao `GHL_WEBHOOK_URL`).

Krenimo redom.

---

# DEO 1 — Kreiranje custom polja "affiliate_code"

Custom polje je „dodatna kolona“ na kontaktu. Mi pravimo jednu koja se zove tačno **affiliate_code** i u nju će GHL upisivati kod affiliate-a (npr. DAMIJAN123).

## Korak 1.1 — Otvaranje Settings

1. Uloguj se u GoHighLevel.
2. U **levom sidebar-u** (levi vertikalni meni) traži ikonicu **zupčanika** ili reč **Settings**.  
   - Ako vidiš samo ikone, zupčanik je obično dole levo.  
   - Ako vidiš i tekst, traži **Settings**.
3. **Klikni** na Settings (ili na zupčanik). Otvoriće se stranica sa podešavanjima.

## Korak 1.2 — Pronalaženje Custom Fields

1. Na stranici Settings traži **levi meni** (podmeni unutar Settings).  
   U različitim verzijama GHL-a može da stoji:
   - **Business** → pa **Custom Fields**, ili  
   - **Company** → **Custom Fields**, ili  
   - Samo **Custom Fields** u glavnom listi.
2. **Klikni** na **Custom Fields**. Otvoriće se lista postojećih custom polja (može biti prazna).

## Korak 1.3 — Dodavanje novog polja

1. Nađi dugme **Add Custom Field** ili **+ New Field** ili **Create Custom Field** (obično gore desno ili iznad liste).
2. **Klikni** na njega. Otvoriće se forma za novo polje.

## Korak 1.4 — Šta tačno da upišeš u formi

U formi ćeš videti nekoliko polja. Popuni ovako:

| Polje u GHL-u (naziv može malo varirati) | Šta tačno da upišeš ili izabereš |
|----------------------------------------|-----------------------------------|
| **Field Name** ili **Label** ili **Name** | Tačno ovako, bez razmaka, mala slova, donja crta: **affiliate_code** |
| **Type** ili **Data Type** ili **Field Type** | **Text** (ili „Single line text“). Ne biraj Number, Dropdown, Date. |
| **Object** ili **Apply to** ili **Related to** | **Contact** (da se polje odnosi na kontakte). |
| **Required** / Obavezno | Ostavi **ne** (unchecked). |
| Ostala polja (placeholder, help text, itd.) | Možeš ostaviti prazno. |

Napomena: ako postoji polje **Key** ili **Internal name**, i tamo treba **affiliate_code** (isto kao Field Name).

## Korak 1.5 — Čuvanje

1. Klikni **Save** ili **Create** ili **Add Field** (dole u formi).
2. Proveri u listi custom polja da se pojavio red sa imenom **affiliate_code** i tipom **Text** za **Contact**.  
Ako ga vidiš — prvi deo je gotov. Možeš zatvoriti Settings ili ostati u GHL-u i preći na Deo 2.

---

# DEO 2 — Pronalaženje workflow-a koji prima leadove

Workflow je „automatizacija“: niz koraka koji se pokreću kada nešto nastane (npr. stigne webhook). Tvoj sajt šalje lead na **webhook URL**; taj URL pokreće jedan konkretan workflow. U tom workflow-u ima akcija **Create Contact** (ili Add/Update Contact) — tu ćemo mapirati `affiliate_code`.

## Korak 2.1 — Otvaranje Automation / Workflows

1. U **levom glavnom meniju** (ne u Settings) traži **Automation** ili **Workflows**.  
   - Može biti ikonica (npr. dijagram/flow) i reč **Automation** ili **Workflows**.
2. **Klikni** na Automation (ili Workflows). Otvoriće se lista workflow-a.

## Korak 2.2 — Koji workflow da otvoriš

1. U listi nađi workflow koji **prima leadove sa sajta**. Kako da ga prepoznaš:
   - **Prvi modul** (prva kartica u nizu) treba da bude **Inbound Webhook** ili **Webhook** (trigger).  
   - Naziv workflow-a može biti npr. "Lead from website", "Website signup", "Create Contact from Webhook" — zavisi kako si ga nazvao.
2. Ako nemaš takav workflow — vidi **DEO 4** na kraju vodiča (kako napraviti workflow od nule).  
3. Ako imaš — **klikni na naziv** tog workflow-a da ga otvoriš. Otvoriće se kanvas sa modulima (kartice u nizu).

## Korak 2.3 — Šta vidiš na kanvasu

- **Prva kartica:** Inbound Webhook (trigger).  
- **Druga ili treća kartica:** obično **Create Contact** ili **Add/Update Contact** ili **Contact – Create**.  
Ova druga/treća kartica je ona koju ćemo menjati u Delu 3.

---

# DEO 3 — Mapiranje affiliate_code u Create Contact

Sada ćemo u akciji „Create Contact“ reći GHL-u: „U polje affiliate_code na kontaktu stavi vrednost koju webhook šalje pod ključem affiliate_code.“

## Korak 3.1 — Otvaranje Create Contact modula

1. Na kanvasu workflow-a **klikni** na karticu **Create Contact** (ili Add/Update Contact).
2. Sa **desne strane** trebalo bi da se otvori **panel** sa podešavanjima tog modula.  
   Ako se ne otvori, probaj **dupli klik** na Create Contact karticu.

## Korak 3.2 — Pronalaženje mesta za Custom Fields

1. U desnom panelu vidiš polja za Email, First Name, Last Name, Phone, itd.
2. **Skroluj nadole** u tom panelu. Traži jednu od ovih sekcija (nazivi mogu varirati):
   - **Custom Fields**
   - **Map Custom Fields**
   - **Additional Fields**
   - **Extra Fields**
3. Ako je sekcija **zatvorena** (savijena), **klikni** na nju da se otvori. Trebalo bi da vidiš listu custom polja — među njima i **affiliate_code** (ako si ga kreirao u Delu 1).

## Korak 3.3 — Dodavanje vrednosti za affiliate_code

Pored **affiliate_code** treba da postoji **polje za vrednost** (prazno ili sa nečim). Tu treba da „ubaciš“ vrednost iz webhook-a.

**Način A — Insert merge field (najčešći):**

1. **Klikni** u prazno polje pored **affiliate_code**.
2. Pojavi se meni ili ikonica (npr. **{ }** ili „Insert merge field“ ili „Add value“). **Klikni** na nju.
3. Otvoriće se lista izvora: **Trigger**, **Workflow**, **Contact**, itd. Izaberi **Trigger** (ili **Webhook** ili **Inbound Webhook** — to je ono što prima podatke sa sajta).
4. Klikni da **proširiš** Trigger. U listi polja traži **affiliate_code** (ili `affiliate_code`). **Klikni** na njega.
5. U polje bi trebalo da se upiše nešto tipa:  
   `{{trigger.affiliate_code}}` ili `{{1.affiliate_code}}` ili slično. To je u redu.

**Način B — Ručni unos (ako nemaš affiliate_code u listi):**

1. U polje pored **affiliate_code** **ručno upiši** (kopiraj i nalepi):  
   **`{{trigger.affiliate_code}}`**  
2. Ako GHL prijavi grešku, probaj: **`{{workflow.affiliate_code}}`** ili **`{{1.affiliate_code}}`** (zavisi od verzije).
3. Sačuvaj (vidi Korak 3.4).

## Korak 3.4 — Čuvanje modula i workflow-a

1. U desnom panelu nađi **Save** ili **Done** ili **OK** i **klikni** da sačuvaš podešavanja **Create Contact** modula.
2. **Gore desno** na stranici workflow-a nađi **Save** (za ceo workflow) i **klikni** da sačuvaš workflow.

Posle ovoga, svaki put kad sajt pošalje lead na webhook sa poljem `affiliate_code`, GHL će pri kreiranju kontakta upisati tu vrednost u custom polje **affiliate_code**.

---

# DEO 4 — Ako još nemaš workflow (kreiranje od nule)

Ako u Automation/Workflows nemaš nijedan workflow sa Inbound Webhook-om, evo minimalnog setapa.

## Korak 4.1 — Novi workflow

1. **Automation** → **Workflows** → **Create Workflow** (ili **+ New**).
2. Naziv: npr. **Lead from website**. Sačuvaj ako traži.

## Korak 4.2 — Trigger: Inbound Webhook

1. Klikni na **Trigger** (prvi modul) ili „Add trigger“.
2. Pretraži **Webhook** ili **Inbound Webhook** i **izaberi** ga.
3. Klikni **Add** / **Create**. GHL kreira webhook i prikaže **Webhook URL**.  
4. **Kopiraj** ceo URL (npr. `https://services.leadconnectorhq.com/hooks/...`).  
   Ovaj URL treba da staviš u **Vercel** kao vrednost za **GHL_WEBHOOK_URL** (Settings → Environment Variables). Bez toga sajt neće slati leadove u ovaj workflow.

## Korak 4.3 — Akcija: Create Contact

1. Klikni **+** ili „Add step“ **ispod** Webhook modula.
2. Pretraži **Contact** → **Create Contact** (ili **Add/Update Contact**) i **izaberi**.
3. U podešavanjima Create Contact:
   - **Email** → iz Triggera: obično `{{trigger.email}}` ili `{{1.email}}`.
   - **First Name** → `{{trigger.firstName}}` ili `{{1.firstName}}`.
   - **Last Name** → `{{trigger.lastName}}` ili `{{1.lastName}}`.
   - **Phone** → `{{trigger.phone}}` ili `{{1.phone}}`.
   - **Custom Fields** → otvori sekciju i za **affiliate_code** stavi vrednost **`{{trigger.affiliate_code}}`** (kao u Delu 3).
4. Sačuvaj modul i **Save** workflow.

## Korak 4.4 — Uključivanje workflow-a

1. Na vrhu stranice workflow-a nađi prekidač **OFF** / **ON**.
2. Uključi ga u **ON** da workflow prima webhook pozive.

Sada je dovoljno da u Vercel-u imaš **GHL_WEBHOOK_URL** = taj Webhook URL i da redeployuješ sajt. Leadovi sa sajta će stizati u ovaj workflow i kontakt će se kreirati sa **affiliate_code**.

---

# DEO 5 — Gde u GHL-u da vidiš affiliate_code na kontaktu

1. U glavnom meniju idi na **Contacts** (ili **Contacts** → **All Contacts**).
2. Otvori bilo koji **kontakt** (klik na red ili na ime).
3. Na stranici kontakta **skroluj** do sekcije gde su **Custom Fields** ili **Additional info**.  
   Tamo trebalo bi da vidiš polje **affiliate_code** i vrednost (npr. DAMIJAN123 ili prazno ako nije došao preko affiliate linka).

---

# DEO 6 — Testiranje (provera da sve radi)

1. Otvori **anoniman/incognito** prozor u browseru.
2. U adresnu traku upiši (zameni domen ako treba):  
   **https://tvoj-domen.com/?ref=DAMIJAN123**
3. Na sajtu **pošalji formu** (email + po želji telefon) sa nekim **test emailom** (npr. test-ghl@example.com).
4. U GHL-u idi u **Contacts** i **pretraži** taj email.
5. Otvori tog **kontakta** i proveri da u custom poljima postoji **affiliate_code** = **DAMIJAN123**.  
   Ako je tako — mapiranje radi. Ako je prazno, proveri da li je workflow uključen i da li je u Create Contact zaista mapirano `{{trigger.affiliate_code}}`, i da li u Vercel-u stoji tačan **GHL_WEBHOOK_URL** i da si uradio redeploy.

---

# DEO 7 — Šta tačno sajt šalje u GHL (za referencu)

Tvoj sajt šalje POST na tvoj webhook URL sa JSON body-om u ovom formatu (pojedina polja mogu biti prazan string):

```json
{
  "email": "lead@example.com",
  "firstName": "Ime",
  "lastName": "Prezime",
  "name": "Ime Prezime",
  "phone": "+381...",
  "source": "affiliate",
  "affiliate_code": "DAMIJAN123",
  "city": "...",
  "country": "..."
}
```

- **affiliate_code** je prazan string `""` ako lead **nije** došao preko affiliate linka.  
- **affiliate_code** je npr. **DAMIJAN123** ako je posetilac ušao na sajt preko linka sa `?ref=DAMIJAN123` (ili `/ref/DAMIJAN123`) i onda poslao formu.

GHL prima ove podatke u „trigger“ i nudi ih kao **trigger.email**, **trigger.affiliate_code**, itd. Zato u Create Contact mapiraš **affiliate_code** kontakta na **trigger.affiliate_code**.

---

# Rezime — redosled radnji

1. **Settings** → **Custom Fields** → **Add Custom Field** → Field Name: **affiliate_code**, Type: **Text**, Object: **Contact** → Save.
2. **Automation** → **Workflows** → otvori workflow sa **Inbound Webhook** kao triggerom.
3. Klikni na **Create Contact** → u desnom panelu skroluj do **Custom Fields** → pored **affiliate_code** stavi vrednost **`{{trigger.affiliate_code}}`** (Insert merge field → Trigger → affiliate_code).
4. **Save** Create Contact, pa **Save** workflow.
5. U **Vercel** proveri da je **GHL_WEBHOOK_URL** = URL iz tog workflow-a; redeploy ako si ga menjao.
6. **Test:** otvori `?ref=DAMIJAN123`, pošalji formu, u GHL u kontaktu proveri **affiliate_code** = DAMIJAN123.

Ako nešto od koraka nije jasno ili u tvom GHL-u izgleda drugačije (druga reč za „Custom Fields“, druga struktura menija), napiši koji tačno korak i šta vidiš na ekranu — mogu prilagoditi vodič tačno tome.
