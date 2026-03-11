# Uputstvo za deploy / update live sajta – AI Hype Academy

## Preduslovi

- Git repo povezan sa Vercel-om
- Postojeće env varijable u Vercel projektu
- Pristup Vercel dashboardu

---

## Korak 1: Provera lokalno

```bash
npm run build
```

Ako build prođe bez greške, možeš nastaviti.

---

## Korak 2: Commit i push

```bash
git add .
git status                    # proveri šta ide u commit
git commit -m "Update: BlogSection, Meta Pixel Lead, pre-deploy check"
git push origin main
```

*Ako koristiš drugu branch (npr. `master`), zameni `main`.*

---

## Korak 3: Deploy na Vercel-u

### Automatski (preporučeno)

- Pošto je projekat povezan sa Git-om, svaki `git push` automatski pokreće novi deploy.
- U Vercel Dashboardu → projekat → **Deployments** prati status.

### Ručno

1. Otvori [vercel.com](https://vercel.com) i uloguj se
2. Izaberi projekat **AI Hype Academy**
3. **Deployments** → **Redeploy** na poslednjem deploy-u (ako treba ručno)

---

## Korak 4: Env varijable u Vercel-u

1. Vercel Dashboard → projekat → **Settings** → **Environment Variables**
2. Proveri da su postavljene:

| Varijabla | Obavezno | Gde se koristi |
|-----------|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Da | Leads, affiliate, ref |
| `SUPABASE_SERVICE_ROLE_KEY` | Da | Leads, affiliate |
| `RESEND_API_KEY` | Ne | Welcome email |
| `NEXT_PUBLIC_META_PIXEL_ID` | Ne | Fallback 2347723352398323 |
| `POYO_API_KEY` | Ne | Dashboard Studio |
| `OPENAI_API_KEY` | Ne | Chat API |

3. Ako dodaješ nove varijable: **Save** → **Redeploy** da se primene.

---

## Korak 5: Provera nakon deploy-a

1. **Glavna stranica**
   - Učitava se bez greške
   - Hero forma, BlogSection, VideoShowcase rade

2. **Leads**
   - Prijavi se test emailom preko Hero forme
   - U Supabase tabeli `leads` treba da se pojavi novi red
   - Proveri inbox (ako je Resend podešen) – treba da stigne welcome email

3. **Meta Pixel**
   - U browser DevTools → Network → filter `facebook`
   - Ili: Meta Events Manager → Test Events → pregled u realnom vremenu
   - Prijava leada treba da pošalje PageView i Lead event

4. **Affiliate link**
   - Otvori `https://tvoj-domen.com/ref/TEST`
   - Treba da te vrati na homepage sa `?ref=TEST`
   - U Supabase tabeli `affiliate_clicks` treba novi red (ako postoji affiliate sa kodom TEST)

---

## Česti problemi

| Problem | Rešenje |
|---------|---------|
| Build fails na Vercel | Proveri build log, verovatno nedostaje env varijabla |
| Leads se ne upisuju | Proveri `NEXT_PUBLIC_SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` |
| Meta Pixel ne prati | Proveri da li je fbq blokiran (ad blocker) i da li je Pixel ID tačan |
| Stare slike/verzija | Hard refresh (Ctrl+Shift+R) ili očisti Vercel cache – **Redeploy** |

---

## Rollback (vraćanje na prethodnu verziju)

1. Vercel → **Deployments**
2. Nađi prethodni uspešan deploy
3. Tri tačke (⋯) → **Promote to Production**

Ili:

```bash
git revert HEAD
git push origin main
```

---

## Preporučeni redosled za update

1. Uradi `git pull` da imaš aktuelan kod
2. `npm run build` lokalno
3. `git add .` → `git commit` → `git push`
4. Sačekaj Vercel deploy (1–3 min)
5. Proveri glavnu stranicu i leads
6. Proveri Meta Pixel u Events Manageru
