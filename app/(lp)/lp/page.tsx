import Image from "next/image";
import LpEmailForm from "@/components/lp/LpEmailForm";
import LpBackgroundEffects from "@/components/lp/LpBackgroundEffects";
import LpTopBarCountdown from "@/components/lp/LpTopBarCountdown";
import LpWaitlistCount from "@/components/lp/LpWaitlistCount";

/** Kraj 14. apr. 2026 u Beogradu (CEST, +02) = 15. apr. 00:00 lokalno — u skladu sa giveaway 2.–14. apr. */
const TARGET_DATE_MS = new Date("2026-04-15T00:00:00+02:00").getTime();

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="lp-stat-value" style={{ fontWeight: 900, fontSize: 22, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(226,232,240,0.55)" }}>
        {label}
      </div>
    </div>
  );
}

export default function PaidAdsLandingPage() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#050508", color: "#f0f4ff" }}>
      <LpBackgroundEffects />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform: translateY(20px);} to { opacity:1; transform: translateY(0);} }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(139,92,246,0.10);} 50% { box-shadow: 0 0 40px rgba(139,92,246,0.20);} }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.35);} 50% { box-shadow: 0 0 0 10px rgba(74,222,128,0);} }
        .lp-glow{position:absolute; inset:-120px -80px auto -80px; height: 420px; background: radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.10) 0%, transparent 60%); pointer-events:none;}
        .lp-badge{display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); font-weight:700; font-size:11px; letter-spacing:0.12em; text-transform:uppercase;}
        .lp-gradient-text{background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7); -webkit-background-clip:text; background-clip:text; color: transparent;}
        .lp-topbar{position:fixed; top:0; left:0; right:0; z-index:50; height:44px; background: rgba(5,5,8,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.05); display:flex; align-items:center;}
        .lp-countdown{font-variant-numeric: tabular-nums; padding: 6px 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #f0f4ff; animation: glowPulse 2s ease infinite;}
        .lp-reveal{animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;}
        .lp-grid2{display:grid; grid-template-columns: 1fr 1fr; gap:16px;}
        .lp-grid4{display:grid; grid-template-columns: 1fr 1fr; gap:16px;}
        @media (max-width: 768px){
          .lp-grid2{grid-template-columns:1fr;}
          .lp-grid4{grid-template-columns:1fr;}
        }
        @media (prefers-reduced-motion: reduce){
          .lp-reveal{animation:none;}
          .lp-countdown{animation:none;}
        }
      `}</style>

      {/* Floating top bar */}
      <div className="lp-topbar">
        <div className="section-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "rgba(226,232,240,0.75)" }}>
            Prijave se zatvaraju za:
          </span>
          <LpTopBarCountdown targetDateMs={TARGET_DATE_MS} />
        </div>
      </div>

      {/* HERO */}
      <main style={{ position: "relative", paddingTop: 120, paddingBottom: 60 }}>
        <div className="lp-glow" aria-hidden />
        <div className="section-container">
          <div className="lp-reveal" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <Image src="/logo.png" alt="AI Hype Academy" width={180} height={56} sizes="180px" style={{ height: 56, width: "auto" }} priority />
            </div>

            <div className="lp-badge" style={{ justifyContent: "center", margin: "0 auto 18px" }}>
              ⚡ AI EDUKACIJA NOVE GENERACIJE
            </div>

            <h1 style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 14 }}>
              Od nule do <span className="lp-gradient-text">AI projekta</span> koji pravi rezultate
            </h1>

            <p style={{ fontSize: 18, lineHeight: 1.6, color: "rgba(226,232,240,0.70)", marginBottom: 22 }}>
              Nauči kako da koristiš AI za content, influensere i digitalne projekte koji mogu prerasti u realan prihod.
            </p>

            <div style={{ maxWidth: 520, margin: "0 auto" }}>
              <LpEmailForm microcopy="Ako osećaš da kasniš sa AI, ovo je za tebe." />
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex" }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    width: 26, height: 26, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.08)",
                    background: "linear-gradient(135deg, rgba(125,211,252,0.35), rgba(167,139,250,0.25))",
                    marginLeft: i === 0 ? 0 : -10,
                    boxShadow: "0 0 18px rgba(125,211,252,0.10)",
                  }} />
                ))}
              </div>
              <div style={{ color: "rgba(226,232,240,0.70)", fontSize: 13 }}>
                <span style={{ color: "#4ade80", fontWeight: 700 }}><LpWaitlistCount suffix="+" /></span> osoba već čeka na pristup
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="section-divider" />

      {/* Background like main page below hero */}
      <div className="problem-solution-bg">
        <div className="problem-solution-bg__image" aria-hidden />

      {/* TRUST STRIP */}
      <section style={{ padding: "24px 0", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="section-container" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <Stat value="100K+" label="pregleda generisanih AI contentom" />
          <Stat value="10K+" label="pratilaca na AI projektima" />
          <Stat value="30+" label="sati praktičnih lekcija" />
          <Stat value="8" label="modula sa jasnim sistemom" />
        </div>
      </section>

      {/* PROBLEM → SOLUTION */}
      <section style={{ padding: "70px 0" }}>
        <div className="section-container" style={{ maxWidth: 740 }}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div className="lp-badge" style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
              PROBLEM
            </div>
          </div>

          <h2 style={{ textAlign: "center", fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 900, marginBottom: 16 }}>
            Zvuči poznato?
          </h2>

          <div className="lp-grid2" style={{ marginBottom: 18 }}>
            {[
              { e: "😵", t: "Gledaš AI tutorijale…", d: "ali i dalje nemaš ništa konkretno." },
              { e: "🤯", t: "Probao si alate…", d: "ali ne znaš šta tačno da napraviš." },
              { e: "🌀", t: "Svaki dan izlazi novi AI tool…", d: "i samo si sve više zbunjen." },
              { e: "💸", t: "Svi pričaju o zaradi sa AI…", d: "ali niko ne pokazuje jasan put." },
              { e: "👀", t: "I imaš osećaj da se nešto veliko dešava…", d: "a ti stojiš sa strane." },
            ].map((x, i) => (
              <div key={i} className="card" style={{ padding: 22 }}>
                <div style={{ fontSize: 18, marginBottom: 8 }}>{x.e}</div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{x.t}</div>
                <div style={{ color: "rgba(226,232,240,0.55)", lineHeight: 1.65 }}>{x.d}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", margin: "26px 0 14px" }}>
            <div className="lp-badge" style={{ borderColor: "rgba(74,222,128,0.22)", background: "rgba(74,222,128,0.06)" }}>
              REŠENJE
            </div>
          </div>

          <h2 style={{ textAlign: "center", fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 900, marginBottom: 16 }}>
            Postoji jednostavniji način
          </h2>

          <div
            className="card"
            style={{
              padding: 26,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(11,15,26,1) 0%, rgba(11,15,26,0.86) 100%)",
              boxShadow: "0 0 0 1px rgba(125,211,252,0.10), 0 25px 80px rgba(139,92,246,0.10)",
            }}
          >
            <div style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(125,211,252,0.8)", fontWeight: 800 }}>
              ⚡ AI Hype Academy
            </div>
            <div style={{ color: "rgba(226,232,240,0.70)", lineHeight: 1.85, marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>Ne treba ti još 50 tutorijala.</div>
              <div style={{ marginBottom: 8 }}><strong style={{ color: "#f0f4ff" }}>Treba ti jasan sistem.</strong></div>
              <div style={{ marginBottom: 8 }}>
                Put koji ti pokazuje šta tačno da radiš, redosledom koji ima smisla.
              </div>
              <div style={{ marginBottom: 8 }}>Zato smo napravili <strong style={{ color: "#f0f4ff" }}>AI Hype Akademiju</strong>.</div>
              <div>
                Mesto gde učiš kako da koristiš AI za stvarne projekte, a ne samo da testiraš alate.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ŠTA DOBIJAŠ */}
      <section style={{ padding: "0 0 70px" }}>
        <div className="section-container" style={{ maxWidth: 740 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div className="lp-badge">ŠTA DOBIJAŠ</div>
          </div>
          <h2 style={{ textAlign: "center", fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 900, marginBottom: 16 }}>
            Šta ćeš konkretno znati da radiš
          </h2>
          <div className="card" style={{ padding: 26 }}>
            <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(226,232,240,0.70)", lineHeight: 1.95 }}>
              <li>Kako da napraviš AI influensera koji objavljuje svaki dan</li>
              <li>Kako da praviš content koji ima potencijal da ide viral</li>
              <li>Kako da pokreneš AI projekat od nule</li>
              <li>Kako da koristiš AI za dodatni prihod ili biznis</li>
              <li>Kako da automatizuješ sadržaj i uštediš sate rada</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ZAMISLI ZA 3 MESECA */}
      <section style={{ padding: "0 0 70px" }}>
        <div className="section-container" style={{ maxWidth: 740 }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div className="lp-badge">ZAMISLI OVO ZA 3 MESECA</div>
          </div>
          <div className="card" style={{ padding: 26 }}>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>
              Zamisli da za 3 meseca:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(226,232,240,0.70)", lineHeight: 1.9 }}>
              <li>imaš AI projekat koji objavljuje svaki dan</li>
              <li>razumeš alate koje većina tek pokušava da shvati</li>
              <li>imaš skill koji možeš monetizovati</li>
              <li>i nisi više osoba koja samo gleda sa strane</li>
            </ul>
            <div style={{ marginTop: 14, color: "rgba(226,232,240,0.70)", lineHeight: 1.8 }}>
              <div style={{ fontWeight: 800, color: "#f0f4ff", marginBottom: 6 }}>Ne zato što si genije.</div>
              <div style={{ fontWeight: 800, color: "#f0f4ff" }}>Nego zato što imaš sistem.</div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ padding: "0 0 70px" }}>
        <div className="section-container" style={{ maxWidth: 740, textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 900, marginBottom: 12 }}>
            Već <span className="lp-gradient-text"><LpWaitlistCount suffix="+" /></span> ljudi je odlučilo da ne prespava AI talas
          </h2>

          <div className="card" style={{ padding: 22, marginTop: 16 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "#4ade80", animation: "pulse 2s ease infinite" }} />
              <span style={{ fontWeight: 800, color: "rgba(226,232,240,0.8)" }}>Live: <LpWaitlistCount /> osoba na waitlisti</span>
            </div>
            <div style={{ color: "rgba(226,232,240,0.70)", lineHeight: 1.75 }}>
              “Konačno neko ko pokazuje šta zapravo raditi, a ne samo pričati o AI.”
              <div style={{ marginTop: 10, color: "rgba(226,232,240,0.45)", fontSize: 13 }}>— Marko</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "70px 0", position: "relative" }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.08), transparent 60%)",
          pointerEvents: "none",
        }} />
        <div className="section-container" style={{ maxWidth: 740, textAlign: "center", position: "relative" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, marginBottom: 12 }}>
            AI era ne čeka
          </h2>
          <p style={{ color: "rgba(226,232,240,0.70)", fontSize: 16, lineHeight: 1.7, marginBottom: 18 }}>
            Pitanje je da li ćeš biti ispred ili juriti druge.
          </p>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <LpEmailForm microcopy="Ne čekaj da svi krenu. Tad je kasno." />
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "rgba(226,232,240,0.45)" }}>
            <LpTopBarCountdown
              targetDateMs={TARGET_DATE_MS}
              doneText="Prijave su zatvorene."
              activeText="Ne čekaj poslednji minut."
            />
          </div>
        </div>
      </section>

      </div>

      <div className="section-divider" />

      {/* MINI FOOTER */}
      <footer style={{ padding: 20, textAlign: "center", color: "rgba(226,232,240,0.40)", fontSize: 11 }}>
        © 2025 AI Hype Academy. Sva prava zadržana.
      </footer>
    </div>
  );
}

