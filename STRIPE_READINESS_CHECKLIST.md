# Stripe Readiness Checklist — AI Hype Academy

Provera da li sajt ispunjava sve što je potrebno pre uvođenja Stripe-a. Bazirano na Stripe Go Live Checklist, EU consumer law i best practices.

---

## ✅ Šta već imate

| Stavka | Status |
|--------|--------|
| **HTTPS** | ✅ Vercel automatski obezbeđuje SSL |
| **Domen** | ✅ aihype-academy.com |
| **Cene prikazane pre checkout** | ✅ Special offer ima cenu i FAQ |
| **Supabase** | ✅ Lead tracking, korisnici |
| **Tracking** | ✅ Meta, TikTok, GTM pixel |

---

## ❌ Šta nedostaje (obavezno pre Stripe-a)

### 1. **Stranice koje Stripe i EU zahtevaju**

| Stranica | Zašto je potrebna | Trenutno |
|----------|-------------------|----------|
| **Uslovi korišćenja** | Stripe + EU: mora postojati pre kupovine | ❌ Link vodi na `#` |
| **Politika privatnosti** | GDPR, Stripe, Meta Pixel, TikTok | ❌ Link vodi na `#` |
| **Politika refundacije / povrata** | EU consumer law (14 dana za digitalne proizvode) | ❌ Nema |
| **Kontakt** | Obavezan za e-commerce (email, adresa) | ❌ Link vodi na `#` |
| **FAQ (dostupan)** | Smanjuje dispute-ove, podrška | ⚠️ Samo na special/offer (zaštićeno) |

**Footer i Join stranica:** Svi linkovi (Uslovi, Politika, Kontakt) vode na `href="#"` — treba kreirati stvarne stranice.

### 2. **Informacije o prodavcu (EU obavezno)**

Za online prodaju u EU morate imati vidljivo:
- **Naziv prodavca** (firma ili ime)
- **Adresa**
- **Email za kontakt**
- **PIB / matični broj** (ako je pravno lice)
- **Regulator** (npr. tržišni inspektorat)

Ovo obično ide u footer i/ili Uslove korišćenja.

### 3. **Stripe specifično**

| Stavka | Akcija |
|--------|--------|
| **Checkout Session** | Koristiti Stripe Checkout (hosted) — ne card element |
| **Webhooks** | Kreirati endpoint za `checkout.session.completed`, `payment_intent.succeeded` |
| **Idempotency** | Koristiti idempotency keys pri kreiranju PaymentIntent/Checkout |
| **Test vs Live** | Objekti iz test moda ne rade u live — kreirati Products u live kad budete spremni |
| **API verzija** | Stripe SDK 2026-01-28.clover — ažurirati ako koristite stariju |

### 4. **Digitalni proizvod — EU**

Za digitalne proizvode (kurs, pristup platformi):
- **Pravo na odustanak** — 14 dana, ALI za digitalne proizvode se gubi čim korisnik pristane na „odmah“ isporuku
- **Jasna informacija** — morate eksplicitno reći da pristankom na odmah isporuku gube pravo na odustanak
- **Pre-checkout checkbox** — tipično: "Prihvatar uslove i potvrđujem da sam svestan da gubim pravo na odustanak"
- **Refund politika** — jasno napisati (npr. refund u roku X dana ako nisi započeo kurs)

---

## Preporučeni koraci

### Faza 1 — Pre Stripe integracije

1. **Kreirati stranice**
   - `/uslovi` — Uslovi korišćenja
   - `/privatnost` — Politika privatnosti
   - `/refund` — Politika refundacije
   - `/kontakt` — Kontakt (email, eventualno form)

2. **Ažurirati Footer i Join**
   - Zameniti `href="#"` sa stvarnim rutama
   - Join: `<a href="/uslovi">` i `<a href="/privatnost">`

3. **Dodati info o prodavcu u footer**
   - Naziv, adresa, email, PIB (ako postoji)

### Faza 2 — Stripe integracija

1. Stripe Checkout Session za jednokratnu kupovinu kursa
2. Webhook za `checkout.session.completed` → ažurirati Supabase (npr. `hasPaid: true`)
3. Success / Cancel redirect stranice
4. Email potvrda (Stripe ili vlastiti)

### Faza 3 — Pre Go Live

- [ ] Rotirati API ključeve pre prelaska u live
- [ ] Testirati webhook sa Stripe CLI
- [ ] Obraditi edge cases (card declined, timeout, duplicate)
- [ ] Logovati greške (ne kartice ili PII)
- [ ] Proveriti da nema test objekata u produkciji

---

## Sažetak

**Sajt trenutno nije spreman za Stripe** zbog:
1. Nedostajućih stranica: Uslovi, Privatnost, Refund, Kontakt
2. Linkovi vode na `#`
3. Nema vidljivih informacija o prodavcu (obavezno u EU)

**Prioritet:** Kreirati ove stranice i ažurirati linkove pre bilo kakve Stripe integracije. Bez toga riskirate:
- Stripe account review / suspend
- GDPR pritužbe
- EU consumer law kršenja
- Chargeback dispute-ove bez jasne dokumentacije
