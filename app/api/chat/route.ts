import { NextRequest, NextResponse } from "next/server";

const OPENAI_KEY = process.env.OPENAI_API_KEY!;

const SYSTEM_PROMPT = `Ti si AI asistent za AI Hype Academy — praktičan kurs za potpune početnike na Balkanu.

UVEK odgovaraj na SRPSKOM jeziku. Budi prijateljski, profesionalan i koncizan.

O AI HYPE ACADEMY:
- AI Hype Academy je praktičan kurs koji te uči kako da praviš AI influensere i filmske (cinematic) videe, koristiš moderne AI alate za brži rad i sve to pretvoriš u realan izvor prihoda.
- Na kraju kursa dobijaš sertifikat koji potvrđuje tvoje znanje i gradi poverenje kod brendova.
- Kurs ima 8 modula: Osnove, AI Slika & Video, Cinema Produkcija, Viralni Sistemi, Automatizacija, AI Muzika, Vibe Coding, Monetizacija.
- Fokus je na implementaciji, ne teoriji. Svaki modul ima praktične zadatke.
- Prijave su otvorene 3 nedelje, zatim se otvara kupovina na 7 dana pa se zatvara.
- Kurs je za ljude koji žele da nauče AI od nule, hoće jasan sistem, zanima ih pravljenje AI sadržaja, spremni su da primene naučeno.
- Kurs NIJE za ljude koji traže brzu zaradu bez rada, ne žele da uče nove alate, očekuju magično dugme.
- Garancija: Bez rizika — ostaješ samo ako vidiš vrednost.

PRAVILA:
- Odgovaraj KRATKO (max 2-3 rečenice osim ako korisnik traži više detalja)
- Ako te pitaju o ceni, reci da će biti objavljena kad se otvori kupovina
- Ako te pitaju nešto van teme kursa, ljubazno preusmeri na AI Hype Academy
- Koristi "ti" formu, ne "Vi"
- Budi entuzijastičan ali ne preterano prodajni`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chat servis nije konfigurisan. Kontaktirajte administratora." },
        { status: 503 }
      );
    }
    const { messages } = await req.json();

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10),
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: data.choices?.[0]?.message?.content || "Nešto je pošlo po zlu.",
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
