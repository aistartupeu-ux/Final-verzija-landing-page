# Leads by Source — KOMPLETAN SETUP od nule

Korak po korak: šta je urađeno u kodu i šta TI treba da uradiš.

---

## ŠTA JE URAĐENO U KODU (već spremno)

- UTM parametri se čuvaju u cookie kad posetilac uđe (facebook, instagram, affiliate ref)
- Svi leadovi (EmailForm, Join, Special) šalju `source_tag`, UTM i `affiliate_code` u API
- `/api/leads` i `/api/special/access` šalju podatke na Make webhook ako je `LEADS_SOURCE_WEBHOOK_URL` podešena

**Nema dodatnih izmena u kodu — samo deploy i setup ispod.**

---

## TVOJ DEO — KORAK PO KORAK

### KORAK 1: Google Sheet (2 min)

1. Otvori [Google Sheets](https://sheets.google.com) i kreiraj novi spreadsheet
2. Nazovi ga npr. **"Leads by Source"**
3. U **prvi red (1)** upiši zaglavlja:

   | A1 | B1 | C1 | D1 | E1 | F1 | G1 | H1 | I1 |
   |----|----|----|----|----|----|----|----|----|
   | date | email | phone | name | source_tag | utm_source | utm_medium | utm_campaign | affiliate_code |

4. Ostavi red 2 i dalje prazne
5. Sačuvaj (Ctrl+S)

---

### KORAK 2: Make.com — povezivanje Google naloga (2 min)

1. Otvori [make.com](https://make.com) i prijavi se
2. Gore desno: klikni na avatar → **Data Stores** ili **Connections**
3. **Connections** → **Add** → pretraži **Google Sheets**
4. Klikni **Create** → prijavi se na Google i dozvoli pristup
5. Kada vidiš zelenu kvačicu — povezivanje je gotovo

---

### KORAK 3: Make.com — kreiranje scenarija (5 min)

1. U Make: **Scenarios** → **Create a new scenario**
2. Klikni na veliko **+** u centru

#### 3a. Webhook modul (trigger)

3. Pretraži: **Webhooks**
4. Izaberi **Custom webhook**
5. Klikni **Add** — Make kreira webhook
6. Kopiraj **Webhook URL** (npr. `https://hook.eu2.make.com/xxxxxxxx`) — trebaće ti za Vercel
7. Proširi **Show advanced settings** (ako postoji)
8. Nađi **Data structure** → klikni **Add**
9. Izaberi **JSON**
10. U polje zalepi tačno ovo:
    ```json
    {"date":"","email":"","phone":"","name":"","source_tag":"","utm_source":"","utm_medium":"","utm_campaign":"","affiliate_code":""}
    ```
11. Klikni **OK**
12. Klikni **OK** na Webhook modulu

#### 3b. Google Sheets modul (akcija)

13. Klikni **+** ISPOD Webhook modula (ne pored)
14. Pretraži: **Google Sheets**
15. Izaberi **Add a row**
16. **Connection:** izaberi tvoj Google nalog
17. **Spreadsheet:** izaberi "Leads by Source" (tvoj Sheet)
18. **Sheet name:** obično "Sheet1" ili ime prvog lista
19. **Values** — klikni **Add item** 9 puta i popuni:

    | # | Column | Value (klikni u polje pa iz Mapping panela izaberi iz Webhook [1]) |
    |---|--------|-------------------------------------------------------------------|
    | 1 | A | `{{1.date}}` |
    | 2 | B | `{{1.email}}` |
    | 3 | C | `{{1.phone}}` |
    | 4 | D | `{{1.name}}` |
    | 5 | E | `{{1.source_tag}}` |
    | 6 | F | `{{1.utm_source}}` |
    | 7 | G | `{{1.utm_medium}}` |
    | 8 | H | `{{1.utm_campaign}}` |
    | 9 | I | `{{1.affiliate_code}}` |

20. Klikni **OK**
21. **Save** scenario (Ctrl+S)
22. **Toggle ON** (donje desno) da scenario radi

---

### KORAK 4: Vercel — env varijabla (2 min)

1. Otvori [vercel.com](https://vercel.com) → tvoj projekat
2. **Settings** → **Environment Variables**
3. **Add New**
   - **Name:** `LEADS_SOURCE_WEBHOOK_URL`
   - **Value:** URL iz Make (Korak 3, tačka 6)
   - **Environment:** označi **Production** (i Preview ako želiš)
4. Klikni **Save**

---

### KORAK 5: Deploy sajta

1. Uradi **git push** da se najnoviji kod deployuje na Vercel  
   — ili u Vercel Dashboard: **Deployments** → **Redeploy** poslednjeg deploya
2. Sačekaj da deploy završi (zelena kvačica)

---

### KORAK 6: Test (3 min)

1. Otvori svoj live sajt
2. Unesi email u formu (Hero ili bilo gde gde je EmailForm) i submituj
3. U Make: **Scenarios** → tvoj scenario → **History**
   - Trebalo bi da vidiš novi run (zeleni krug)
4. U Google Sheet-u — u drugom redu trebalo bi da se pojavi novi lead sa datom, emailom, source_tag: direct itd.

**Ako ne radi:**
- Proveri Make History — da li se scenario uopšte pokreće? Ako NE → problem u Vercel env ili deploy
- Ako se scenario pokreće ali Sheet je prazan → u History klikni na run, otvori Google Sheets modul, vidi da li piše greška
- Probaj ručno: u Postman ili sl. pošalji POST na Make webhook URL sa JSON body iz LEADS_BY_SOURCE_SETUP.md (sekcija "Ručni test webhooka")

---

## REZIME — šta treba da imaš

| Gde | Šta |
|-----|-----|
| Google Sheet | "Leads by Source" sa zaglavljima u prvom redu |
| Make.com | Scenario: Webhook (sa Data structure) → Google Sheets Add a row, Toggle ON |
| Vercel | `LEADS_SOURCE_WEBHOOK_URL` = Make webhook URL |
| Vercel | Poslednji deploy (git push ili Redeploy) |

---

## Redosled radnji

1. Google Sheet  
2. Make (connections + scenario + Data structure + Values)  
3. Vercel env  
4. Deploy  
5. Test  
