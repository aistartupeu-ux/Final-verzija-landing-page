# HighLevel integracija — Welcome email i kontakt

Kada neko unese email (Hero forma, CTA, Join stranica), podaci idu u Supabase **i** u HighLevel preko webhook-a. U HighLevel-u podešavaš automatski welcome email i follow-up.

---

## Šta treba da uradiš u HighLevel-u

### 1. Kreiraj Workflow sa Inbound Webhook triggerom

1. Uđi u **HighLevel** → **Automation** → **Workflows**
2. **Create Workflow** → **From Scratch**
3. Za **Trigger** izaberi **Inbound Webhook**
4. Sačuvaj workflow — dobićeš **Webhook URL** (npr. `https://services.leadconnectorhq.com/hooks/...`)
5. Kopiraj taj URL

### 2. Dodaj akcije u Workflow

1. **Create Contact** (ili **Update Contact**) — mapiraj polja iz webhook payload-a:
   - `email` → Email
   - `firstName` → First Name
   - `lastName` → Last Name
   - `phone` → Phone
   - `source` → Source
   - `city` → City
   - `country` → Country

2. **Send Email** — welcome email (subject, body, template)

3. Po želji: dodaj **Add Tag**, **Add to Sequence**, itd.

### 3. Dodaj Webhook URL u Vercel

Vercel → Settings → Environment Variables:
- **Name:** `GHL_WEBHOOK_URL`
- **Value:** tvoj webhook URL iz HighLevel (npr. `https://services.leadconnectorhq.com/hooks/...`)
- Redeploy projekat

---

## Šta sajt šalje u webhook

Svaki put kad neko submita email (bilo gde na sajtu), šalje se:

```json
{
  "email": "korisnik@email.com",
  "firstName": "Ime",
  "lastName": "Prezime",
  "name": "Ime Prezime",
  "phone": "+381...",
  "source": "AI Hype Academy",
  "city": "Beograd",
  "country": "Serbia"
}
```

U HighLevel triggeru mapiraj ova polja na svoje kontakt polja.

---

## Vercel env varijabla

| Varijabla       | Opis                                                |
|-----------------|-----------------------------------------------------|
| `GHL_WEBHOOK_URL` | Webhook URL iz HighLevel workflow (Inbound Webhook) |

Bez ove varijable integracija ne radi — ostaje samo Supabase + Resend (ako je podešen).

---

## Resend vs HighLevel

- **Resend** — ako je `RESEND_API_KEY` podešen, šalje se direktan welcome email iz koda
- **HighLevel** — ako je `GHL_WEBHOOK_URL` podešen, lead se šalje u HighLevel; welcome email i sve ostalo radi tvoj workflow

Možeš imati oba: Resend za brzi email + HighLevel za CRM i dodatne automacije.
