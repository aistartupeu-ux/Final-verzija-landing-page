# Kako proveriti stress test za sajt

## 1. Brzo (bez instalacije) — online alati

- **[Loader.io](https://loader.io)**  
  Unesi URL sajta, izaberi broj korisnika i trajanje. Besplatno za ograničen broj testova. Idealno za produkciju (npr. `https://tvoj-domen.com`).

- **[k6 Cloud](https://grafana.com/products/cloud/k6/)**  
  Grafana nudi trial; možeš pokrenuti test sa njihovih servera prema tvom domenu.

- **[WebPageTest](https://www.webpagetest.org)**  
  Više za performanse po stranici (vreme učitavanja), manje za “koliko zahteva izdrži”.

---

## 2. Lokalno sa k6 (preporučeno za ponavljanje)

### Instalacija k6

- **Windows (Chocolatey):**  
  `choco install k6`
- **Windows (winget):**  
  `winget install k6 --source winget`
- **Ili preuzmi:**  
  [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation)

### Pokretanje stress testa iz projekta

U root-u projekta:

```bash
# Test na lokalni dev server (pokreni u drugom terminalu: npm run dev)
k6 run scripts/stress-test.js

# Test na produkciju (zameni sa pravim domenom)
set BASE_URL=https://tvoj-domen.vercel.app
k6 run scripts/stress-test.js
```

Na macOS/Linux umesto `set` koristi:  
`BASE_URL=https://tvoj-domen.vercel.app k6 run scripts/stress-test.js`

Skripta postepeno povećava opterećenje (20 → 50 → 100 virtuelnih korisnika), šalje zahteve na `/`, `/join`, `/affiliate` i na kraju prikazuje statistiku (RPS, latencija, % grešaka).

---

## 3. Apache Bench (ab) — najbrži način

Ako imaš instaliran Apache (ili samo `ab`):

```bash
# 1000 zahteva, 50 istovremenih
ab -n 1000 -c 50 https://tvoj-domen.vercel.app/
```

---

## 4. Šta gledati

- **http_req_duration** — koliko traju zahtevi (p95 < 2–5s je ok za običan sajt).
- **http_req_failed** — procenat neuspešnih (trebalo bi blizu 0).
- **Vercel** ima limite po planu; ako pređeš, dobićeš 429 ili timeout — to je i cilj stress testa da vidiš granicu.

---

## 5. Napomena za produkciju

Stress test na **live domen** stvara pravi saobraćaj. Koristi umeren broj VU (npr. 50–100) ili koristi Loader.io sa ograničenim testom da ne preopteretiš Vercel/Supabase.
