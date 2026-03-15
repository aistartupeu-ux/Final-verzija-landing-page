# Mapiranje affiliate_code u GoHighLevel — korak po korak

Kompletno uputstvo: šta tačno da klikneš da bi mapirao `affiliate_code` iz webhook-a u GHL kontakt.

---

## Korak 0: Proveri da imaš custom field

Pre nego što kreneš, mora da postoji custom field **affiliate_code** na Contact objektu.

**Provera:**
1. Settings (zupčanik) → **Custom Fields** (ili Business → Custom Fields)
2. Ako nemaš `affiliate_code`, dodaj ga:
   - **Add Custom Field** → Field Name: `affiliate_code` → Type: Text → Object: Contact → Save

---

## Korak 1: Otvori workflow

1. Levo u meniju klikni **Automation** (ikonica automatskog podešavanja)
2. Klikni **Workflows**
3. Nađi workflow koji prima leadove (onaj sa **Inbound Webhook** kao prvim modulom)
4. **Klikni na naziv** workflow-a da ga otvoriš

---

## Korak 2: Otvori Create Contact akciju

1. U workflow-u vidiš module u nizu. Prvi je **Inbound Webhook** (trigger)
2. Druga ili treća akcija obično je **Create Contact** ili **Add/Update Contact**
3. **Klikni na tu karticu** (na "Create Contact") — otvoriće se panel sa podešavanjima sa desne strane
4. Ako se panel ne otvori, **dupli klik** na Create Contact

---

## Korak 3: Skroluj do Custom Fields

1. U desnom panelu imaš sekcije: Email, First Name, Phone itd.
2. **Skroluj nadole** dok ne nađeš:
   - **Custom Fields**, ili
   - **Map Custom Fields**, ili
   - **Additional Fields** / **Extra Fields**
3. Klikni da proširiš tu sekciju ako je zatvorena

---

## Korak 4: Dodaj mapiranje za affiliate_code

**Opcija A — ako vidiš listu custom polja:**

1. U listi nađi **affiliate_code**
2. Pored njega je prazno polje za vrednost
3. **Klikni u to polje**
4. Pojaviće se meni. Izaberi **Insert merge field** / **Custom value** / **From workflow**
5. U padajućoj listi traži **Trigger** / **Webhook** / **Inbound Webhook**
6. Klikni da proširiš
7. Nađi **affiliate_code** (ili `affiliate_code` sa donjom crtom) i **klikni** na njega
8. Trebalo bi da se u polju pojavi nešto tipa `{{trigger.affiliate_code}}` ili `{{webhook.affiliate_code}}`

**Opcija B — ako imaš dugme "Add custom field" / "+":**

1. Klikni **Add custom field** ili **+ Add field**
2. Iz padajuće liste izaberi **affiliate_code**
3. U polje za vrednost klikni
4. Izaberi **Insert merge field** → **Trigger** → **affiliate_code**

**Opcija C — ako ručno unosiš:**

1. U polje pored affiliate_code upiši tačno: `{{trigger.affiliate_code}}`
2. Ili probaj: `{{workflow.affiliate_code}}` — zavisi od GHL verzije
3. GHL će prihvatiti validan merge field

---

## Korak 5: Sačuvaj

1. Klikni **Save** / **Done** / **OK** u panelu Create Contact
2. Gore desno u workflow-u klikni **Save** da sačuvaš ceo workflow

---

## Korak 6: Provera (test)

1. Otvori incognito prozor
2. Idi na: `https://www.aihype-academy.com/?ref=DAMIJAN123`
3. Submit formu sa test emailom
4. U GHL idi u **Contacts** → nađi tog kontakta po email-u → otvori ga
5. Skroluj do custom field-ova — trebalo bi da vidiš **affiliate_code** = `DAMIJAN123`

---

## Ako ne vidiš `affiliate_code` u listi merge field-ova

GHL ponekad "uči" polja iz prvog primljenog webhook request-a. Ako još nisi primio lead sa `affiliate_code`:

1. Pošalji **test lead** preko affiliate linka (korak 6 iznad)
2. Zatvori i ponovo otvori Create Contact
3. Klikni u polje za vrednost → Insert merge field → proveri da li sada ima **affiliate_code**

Alternativa: u nekim GHL verzijama možeš ručno uneti `{{trigger.affiliate_code}}` — GHL će prihvatiti ako webhook šalje to polje.

---

## Šta sajt šalje (za referencu)

Tvoj sajt šalje u GHL webhook ovaj JSON:

```json
{
  "email": "...",
  "firstName": "...",
  "lastName": "...",
  "name": "...",
  "phone": "...",
  "source": "affiliate" ili "AI Hype Academy",
  "affiliate_code": "DAMIJAN123" ili "",
  "city": "...",
  "country": "..."
}
```

Ključ `affiliate_code` postoji uvek (može biti prazan string ako nije affiliate lead). GHL ga prima i nudi kao `trigger.affiliate_code` u merge field-ovima.
