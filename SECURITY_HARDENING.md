# Zaštita sajta — preporuke za teško bypass

Ovaj dokument opisuje implementiranu zaštitu i korake van koda (Vercel, Namecheap, GitHub).

---

## Status — pregled

| Sloj | Status |
|------|--------|
| Security headers (CSP, HSTS, X-Frame-Options…) | Implementirano |
| Admin sesija (HMAC + HttpOnly cookie) | Implementirano |
| Rate limiting API | Implementirano |
| LP zaštita (UTM/click ID) | Implementirano |
| Vercel / Namecheap / GitHub | Ručno podesi |
| Cloudflare | Planirano za kasnije |

---

## Implementirano u kodu

### 1. Security headers (next.config)

- **X-Frame-Options: DENY** — sprečava clickjacking (iframe ugrađivanje)
- **X-Content-Type-Options: nosniff** — blokira MIME sniffing
- **Referrer-Policy** — ograničava šta se šalje u Referer zaglavlju
- **Permissions-Policy** — isključuje kameru, mikrofon, geolokaciju, FLoC
- **Content-Security-Policy (CSP)** — ograničava izvore skripti, stilova, connect-ova (zaštita od XSS i injekcija)
- **Strict-Transport-Security (HSTS)** — forsira HTTPS (samo produkcija)

### 2. Admin sesija — HMAC + HttpOnly

- **Path:** `/admin/login` → prijava; `/admin/x7k9m2q4` → dashboard
- **Token:** HMAC-SHA256 potpísan, base64url; payload sadrži `exp` (24h)
- **Cookie:** `admin_session` — HttpOnly, Secure (prod), SameSite=Strict, Path=/admin
- **Middleware:** blokira pristup `/admin/*` (osim login) bez validne sesije
- **Timing-safe** poređenje potpisa — sprečava timing atake

### 3. Rate limiting (API)

| Ruta | Limit |
|------|--------|
| `/api/leads` | 20/min po IP |
| `/api/affiliate/track` | 60/min po IP |
| `/api/ai/generate` | 10/min po IP |
| `/api/ai/music` | 10/min po IP |

### 4. Zaštita LP stranice

- Middleware blokira direktan pristup `/lp` bez UTM ili click ID parametara

---

## Vercel — šta da podesiš

| Akcija | Gde |
|--------|-----|
| **Password Protection za preview** | Settings → Deployment Protection |
| **Provera env varijabli** | Settings → Environment Variables |
| **Branch protection** | GitHub repo → Settings → Branches |

- **Deployment Protection:** uključi za **Preview** deploy-ove — samo ti i tim imaju pristup
- **Env:** sve tajne preko Vercel UI, nikad u kodu
- **Rotacija ključeva:** periodično menjaj `ADMIN_ANALYTICS_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `POYO_API_KEY`

---

## Namecheap — šta da podesiš

| Akcija | Gde |
|--------|-----|
| **2FA** | Account → Security |
| **Domain Lock (RegLock)** | Domain List → Manage → Reglock |
| **WhoisGuard** | Domain List → Manage |

- **2FA:** sprečava krađu domena i DNS-a
- **RegLock:** blokira neovlašćen transfer domena

---

## GitHub — šta da podesiš

| Akcija | Gde |
|--------|-----|
| **2FA** | Account → Security |
| **Branch protection** | Repo → Settings → Branches → Add rule za `main` |
| **Collaborators** | Repo → Settings → Collaborators |

---

## Cloudflare — planirano za kasnije

Kad budemo dodavali Cloudflare:

- **DDoS zaštita**
- **WAF** (Web Application Firewall)
- **Bot management**
- **Rate limiting** na nivou mreže

Koraci: [cloudflare.com](https://cloudflare.com) → Free plan → dodaj domen → prebaci nameservers u Namecheap-u.

---

## Baza (Supabase)

- **Row Level Security (RLS)** — podešena za leads, affiliates
- **Pristup** — samo service role na serveru; anon key gde je potrebno public read

---

## CSP — šta blokira

- Izvori skripti: samo self + GTM, Meta, TikTok
- `connect`: samo dozvoljeni API-ji
- `object-src: none` — blokira Flash, Java
- `form-action: self` — forme samo na tvoj domen

Ako nešto prestane da radi, proveri konzolu browsera i dodaj izvor u `next.config.ts`.

---

## Rotacija ADMIN_ANALYTICS_SECRET

1. Generiši novi kod ([random.org](https://www.random.org/strings/) — 32+ karaktera)
2. Vercel → Settings → Environment Variables → zameni `ADMIN_ANALYTICS_SECRET`
3. Redeploy
4. Postojeće admin sesije postaju nevalidne — ponovna prijava na `/admin/login`
