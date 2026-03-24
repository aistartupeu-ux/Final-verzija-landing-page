import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Politika privatnosti | AI Hype Academy",
  description: "Politika privatnosti AI Hype Academy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508" }}>
      <main className="section-container" style={{ paddingTop: 72, paddingBottom: 48, maxWidth: 920 }}>
        <Link href="/" style={{ color: "#666", fontSize: 12, textDecoration: "none" }}>Nazad na početnu</Link>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 34px)", marginTop: 16, marginBottom: 8 }}>Politika privatnosti</h1>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 28 }}>Poslednje ažuriranje: 24.03.2026</p>

        <div style={{ color: "#cfcfd6", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-line" }}>
{`Ova Politika privatnosti objašnjava kako Miloš Trivković, sa registrovanom adresom Štihova ulica 13, 1000 Ljubljana, Slovenija, kontakt email: support@aihypeacademy.com, kao prodavac i rukovalac podacima za program AI Hype Akademija, prikuplja, koristi, čuva i štiti podatke o ličnosti korisnika sajta i kupaca digitalnog proizvoda.

1. Ko je rukovalac podacima
Rukovalac podacima je:
Miloš Trivković
Štihova ulica 13, 1000 Ljubljana, Slovenija
Email: support@aihypeacademy.com
Poreski / identifikacioni broj: 9811800000
Ova politika je zasnovana na pravilima o transparentnosti, svrsi obrade, minimizaciji podataka, ograničenom roku čuvanja, tačnosti i bezbednosti obrade podataka.

2. Koje podatke možemo prikupljati
Možemo prikupljati sledeće kategorije podataka:
• ime i prezime
• email adresu
• broj telefona, ako ga unesete
• podatke o kupovini i plaćanju
• podatke o pristupu kursu i community-ju
• tehničke podatke, kao što su IP adresa, tip uređaja, pregledač, logovi pristupa
• marketinške i analitičke podatke, uključujući podatke iz kolačića i sličnih tehnologija, kada su aktivirane
GDPR zahteva da korisnik bude obavešten o tome ko obrađuje podatke, zašto, koliko dugo, kome se podaci otkrivaju i koja prava ima.

3. Svrhe i pravni osnov obrade
Vaše podatke obrađujemo radi:
a) izvršenja ugovora
Za obradu kupovine, potvrdu uplate, dodelu pristupa programu AI Hype Akademija, pristup community-ju i korisničku podršku.

b) poštovanja zakonskih obaveza
Za vođenje poslovnih evidencija, računovodstvenih i poreskih obaveza, kao i postupanje po važećim propisima.

c) legitimnog interesa
Za zaštitu sajta, sprečavanje zloupotreba, bezbednost sistema, osnovnu analitiku, vođenje evidencije o pristupu i unapređenje usluge.

d) pristanka
Za slanje marketinških email poruka, newsletter komunikacije, remarketing i neobavezne kolačiće i tracking alate, kada je takav pristanak potreban.
Za marketinške email poruke koristi se odvojen pristanak; slanje komercijalnih poruka elektronskim putem prema srpskom okviru je dozvoljeno samo uz prethodni pristanak.

4. Sa kim delimo podatke
Vaše podatke možemo deliti sa pružaocima usluga koji nam pomažu da realizujemo prodaju i isporuku proizvoda, uključujući:
• Stripe za obradu plaćanja
• Skool za pristup programu i community-ju
• pružaoce hostinga i baze podataka, kao što su Vercel i Supabase, ako ih koristimo
• pružaoce email i korisničke podrške
• analitičke i marketinške platforme, kada se koriste uz odgovarajući pravni osnov
Takvi subjekti mogu obrađivati podatke u naše ime ili, kada je to potrebno po prirodi usluge i zakonskim obavezama, u sopstvenoj ulozi prema primenljivim pravilima. GDPR traži da obrada od strane trećih lica bude uređena odgovarajućim ugovornim odnosom i odgovarajućim merama zaštite.

5. Međunarodni prenos podataka
Pošto koristimo online alate i platforme, vaši podaci mogu biti preneti ili dostupni van Evropskog ekonomskog prostora. Kada do toga dođe, nastojaćemo da se prenos vrši samo uz odgovarajući nivo zaštite, kao što su odluka o adekvatnosti ili odgovarajuće ugovorne zaštitne mere, uključujući standardne ugovorne klauzule kada je to primenljivo.

6. Koliko dugo čuvamo podatke
Podatke čuvamo onoliko dugo koliko je potrebno za svrhu zbog koje su prikupljeni, a posebno:
• podatke o kupovini i računovodstvenu dokumentaciju u rokovima koje zahtevaju važeći propisi
• podatke o korisničkom nalogu i pristupu dok traje pristup programu i razuman period nakon toga radi podrške, zaštite i evidencije
• marketinške podatke do povlačenja pristanka ili prestanka svrhe
• tehničke logove i sigurnosne evidencije u razumnom roku potrebnom za zaštitu sistema
Načelo ograničenog čuvanja je jedno od osnovnih pravila obrade podataka.

7. Vaša prava
U skladu sa primenljivim pravilima, imate pravo da:
• budete informisani o obradi
• zatražite pristup svojim podacima
• tražite ispravku netačnih ili nepotpunih podataka
• tražite brisanje podataka kada za to postoje uslovi
• tražite ograničenje obrade
• uložite prigovor na obradu
• tražite prenosivost podataka kada je primenljivo
• povučete pristanak u bilo kom trenutku, kada se obrada zasniva na pristanku
Zahtev možete poslati na: support@aihypeacademy.com. Ova prava proizlaze direktno iz GDPR okvira i paralelnog domaćeg okvira za zaštitu podataka.

8. Pritužba nadzornom organu
Ako smatrate da obrada vaših podataka nije u skladu sa zakonom, imate pravo da podnesete pritužbu nadležnom organu za zaštitu podataka. Pošto je rukovalac naveden sa adresom u Sloveniji, nadzorni organ je u pravilu Informacijski pooblaščenec Republike Slovenije.

9. Kolačići i tracking
Sajt može koristiti neophodne kolačiće za rad sajta, kao i analitičke i marketinške kolačiće i slične tehnologije, uključujući pixel i tag alate, kada su uključeni. Neobavezni kolačići i marketing tracking treba da budu aktivirani tek po odgovarajućem izboru korisnika, kada je to potrebno po pravilima koja se primenjuju na tvoje tržište. Transparentnost i informisanost korisnika su obavezni deo obrade.

10. Bezbednost
Preduzimamo razumne tehničke i organizacione mere radi zaštite podataka od neovlašćenog pristupa, gubitka, zloupotrebe ili neovlašćenog otkrivanja. Ipak, nijedan prenos preko interneta ili elektronsko čuvanje nije apsolutno bez rizika.

11. Izmene politike
Zadržavamo pravo da ovu Politiku privatnosti povremeno izmenimo radi usklađivanja sa pravnim, tehničkim ili poslovnim promenama. Važeća verzija će uvek biti objavljena na sajtu uz datum poslednjeg ažuriranja.`}
        </div>
      </main>
      <Footer />
    </div>
  );
}