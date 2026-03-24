import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Politika refundacije | AI Hype Academy",
  description: "Politika odustanka i refundacije.",
};

export default function RefundPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508" }}>
      <main className="section-container" style={{ paddingTop: 72, paddingBottom: 48, maxWidth: 920 }}>
        <Link href="/" style={{ color: "#666", fontSize: 12, textDecoration: "none" }}>Nazad na početnu</Link>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 34px)", marginTop: 16, marginBottom: 8 }}>Politika odustanka i refundacije</h1>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 28 }}>Poslednje ažuriranje: 24.03.2026</p>

        <div style={{ color: "#cfcfd6", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-line" }}>
{`1. Priroda proizvoda
AI Hype Akademija je digitalni edukativni proizvod sa pristupom online sadržaju i community-ju, koji se isporučuje elektronskim putem nakon uspešne uplate.

2. Trenutni početak isporuke
Kupac je pre zaključenja kupovine jasno obavešten da isporuka digitalnog sadržaja počinje odmah po uspešnoj uplati i aktivaciji pristupa. Kupac na checkout-u daje izričitu saglasnost za trenutni početak isporuke i potvrđuje da je upoznat da time, u meri dozvoljenoj primenljivim pravom, gubi pravo na odustanak nakon početka isporuke digitalnog sadržaja. Ovo je ključni uslov za digitalni sadržaj.

3. Opšte pravilo refundacije
Zbog prirode digitalnog proizvoda i činjenice da pristup počinje odmah nakon kupovine, refundacija se po pravilu ne odobrava nakon što je pristup aktiviran, osim u slučajevima navedenim u ovoj politici ili kada kupcu pripadaju prava koja se ne mogu zakonski isključiti. Jednostavna formulacija "nema refundacije ni po kom osnovu" je rizična i slabija od ovakvog modela.

4. Slučajevi u kojima refundacija može biti odobrena
Refundacija može biti razmotrena u sledećim slučajevima:
• dvostruko terećenje ili očigledna greška u naplati
• tehnička greška na strani prodavca zbog koje pristup kupljenom proizvodu nije isporučen u razumnom roku
• pogrešno obračunat iznos
• slučajevi u kojima je refundacija potrebna po osnovu prinudnih propisa

5. Kako se podnosi zahtev
Zahtev se podnosi email-om na: support@aihypeacademy.com
U zahtevu kupac treba da navede:
• ime i prezime
• email korišćen pri kupovini
• datum kupovine
• kratak opis problema
• dokaz o uplati, ako je dostupan

6. Rok za odgovor
Prodavac će zahtev razmotriti i odgovoriti u razumnom roku, a najkasnije u roku koji nalažu primenljivi propisi ili interni procesi potrebni za proveru plaćanja i pristupa.

7. Napomena za potrošače
Ova politika ne isključuje niti ograničava prava kupca koja mu pripadaju po osnovu obaveznih propisa o zaštiti potrošača. Srpski okvir izričito polazi od toga da se prava potrošača ne mogu unapred oduzeti ugovorom.`}
        </div>
      </main>
      <Footer />
    </div>
  );
}