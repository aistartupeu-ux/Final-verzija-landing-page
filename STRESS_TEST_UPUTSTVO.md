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

## 5. Optimizacije na sajtu (da bolje izdrži load)

- **Hero video** — učitava se tek kad je hero u viewportu (`preload="none"` + poster), bez preload u `<head>`.
- **NetworkBackground** — 24 čvora (12 ako je prefers-reduced-motion), veza 145px; animacija se pauzira kad je tab u pozadini (`document.hidden`).
- **SpotlightCursor** — crta se samo dok je miš aktivan; petlja se zaustavlja kad je kursor miran ~150 ms ili na mouseleave; pravilno uklanjanje listenera (bez curenja memorije).
- **VideoShowcaseSection** — manji rootMargin i delay pre učitavanja videa; `prefers-reduced-motion` isključuje auto-animaciju.
- **ScrollProgress** — traka preko `transform: scaleX()` (bez layout thrashing).
- **Cache** — MP4 7 dana (`max-age=604800`), webp/avatari 1 godina; slike preko Next Image sa AVIF/WebP i dugim cache TTL.
- **API** — rate limit na `/api/leads` (20/min) i `/api/affiliate/track` (60/min); rate mape se čiste od isteklih unosa kad pređu prag (ograničena memorija na serveru). Sheet upisi se **await**-uju da se završe pre odgovora (Vercel ne gasi funkciju pre vremena).

---

## 6. Napomena za produkciju

Stress test na **live domen** stvara pravi saobraćaj. Koristi umeren broj VU (npr. 50–100) ili koristi Loader.io sa ograničenim testom da ne preopteretiš Vercel/Supabase.
