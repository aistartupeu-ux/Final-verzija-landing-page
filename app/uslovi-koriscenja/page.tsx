import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Uslovi korišćenja | AI Hype Academy",
  description: "Uslovi korišćenja i opšti uslovi prodaje.",
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508" }}>
      <main className="section-container" style={{ paddingTop: 72, paddingBottom: 48, maxWidth: 920 }}>
        <Link href="/" style={{ color: "#666", fontSize: 12, textDecoration: "none" }}>Nazad na početnu</Link>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 34px)", marginTop: 16, marginBottom: 8 }}>Uslovi korišćenja i opšti uslovi prodaje</h1>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 28 }}>Poslednje ažuriranje: 24.03.2026</p>

        <div style={{ color: "#cfcfd6", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-line" }}>
{`Ovi Uslovi uređuju pristup sajtu i kupovinu programa AI Hype Akademija.

1. Prodavac
Prodavac digitalnog proizvoda je:
Miloš Trivković
Štihova ulica 13, 1000 Ljubljana, Slovenija
Email: support@aihypeacademy.com
Poreski / identifikacioni broj: 9811800000
U dokumentima i na checkout-u koristi isti registrovani identitet koji stoji u poslovnom registru i na Stripe nalogu.

2. Predmet prodaje
AI Hype Akademija je digitalni edukativni proizvod koji kupcu pruža pristup online sadržaju i community-ju putem platforme Skool, uz jednokratno plaćanje.

3. Cena i plaćanje
Cena programa iznosi 297 EUR i prikazuje se pre zaključenja kupovine. Plaćanje se vrši elektronski preko pružaoca usluge plaćanja Stripe ili drugog navedenog procesora plaćanja.
Stripe očekuje da cena, kontakt i fulfillment politike budu jasno prikazani pre kupovine.

4. Isporuka i pristup
Nakon uspešne uplate kupcu se dodeljuje pristup digitalnom sadržaju i community-ju, bez nepotrebnog odlaganja, prema tehničkim pravilima platforme i internom procesu aktivacije.
Kupac je dužan da navede tačne podatke pri kupovini. Kupac je odgovoran za pristup svojoj email adresi i za bezbedno korišćenje naloga.

5. Digitalni sadržaj i pravo na odustanak
Kupovinom AI Hype Akademije kupac naručuje digitalni sadržaj i pristup digitalnoj platformi. Pre završetka kupovine kupac daje izričitu saglasnost da isporuka počne odmah po uspešnoj uplati i potvrđuje da je upoznat da time, u meri dozvoljenoj primenljivim propisima, može izgubiti pravo na odustanak nakon početka isporuke digitalnog sadržaja. Ova odredba ne isključuje prava koja se kupcu ne mogu zakonski uskratiti.

6. Korišćenje naloga
Kupac ne sme deliti pristupne podatke sa trećim licima, preprodavati pristup, neovlašćeno distribuirati sadržaj kursa ili koristiti sadržaj suprotno ovim Uslovima.
Prodavac zadržava pravo da, u slučaju zloupotrebe, ograniči ili ukine pristup, uz poštovanje obaveznih prava kupca.

7. Intelektualna svojina
Sav sadržaj programa, uključujući video materijale, tekstove, strukturu, vizuale, lekcije, dokumente, nazive i druge elemente, zaštićen je pravima intelektualne svojine i namenjen je isključivo za ličnu upotrebu kupca, osim ako je drugačije izričito dogovoreno.

8. Odricanje od odgovornosti u vezi sa rezultatima
AI Hype Akademija je edukativni proizvod. Ne garantuju se konkretni poslovni, finansijski ili profesionalni rezultati, jer isti zavise od niza faktora van kontrole prodavca, uključujući angažovanje korisnika, tržišne okolnosti, prethodno znanje i primenu naučenog.

9. Podrška i reklamacije
Za podršku, pitanja i reklamacije kupac može pisati na: support@aihypeacademy.com.
Preporuka je da na sajtu dodaš i broj telefona ili drugi direktan kanal, jer Stripe posebno traži lako uočljive i direktne kontakt metode.

10. Merodavno pravo
Na ove Uslove primenjuje se pravo Republike Slovenije i relevantni propisi Evropske unije, uz zadržavanje obavezne zaštite potrošača koja se ne može isključiti u skladu sa pravilima koja se primenjuju na potrošača. Izbor prava ne može ukinuti obaveznu zaštitu potrošača kada je prodaja usmerena ka njegovom tržištu.`}
        </div>
      </main>
      <Footer />
    </div>
  );
}