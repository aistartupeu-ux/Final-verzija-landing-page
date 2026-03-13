import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, name } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Get location from ipapi using the real visitor IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "";
    const ipapiKey = process.env.IPAPI_API_KEY;
    let city: string | null = null;
    let country: string | null = null;
    let country_code: string | null = null;

    try {
      const path = ip ? `${ip}/json/` : "json/";
      const keyParam = ipapiKey ? `?key=${ipapiKey}` : "";
      const geoRes = await fetch(
        `https://ipapi.co/${path}${keyParam}`,
        { next: { revalidate: 0 } }
      );
      const geo = await geoRes.json();
      city = geo.city ?? null;
      country = geo.country_name ?? null;
      country_code = geo.country_code ?? null;
    } catch {
      // Location is optional
    }

    const { error } = await supabase.from("leads").insert({
      email,
      phone: phone ?? null,
      name: name ?? null,
      city,
      country,
      country_code,
      ip: ip || null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // HighLevel: pošalji lead u webhook (trigger za kontakt + welcome email)
    const ghlWebhook = process.env.GHL_WEBHOOK_URL;
    if (ghlWebhook) {
      try {
        await fetch(ghlWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName: name?.split(" ")[0] ?? name ?? "",
            lastName: name?.split(" ").slice(1).join(" ") ?? "",
            name: name ?? "",
            phone: phone ?? "",
            source: "AI Hype Academy",
            city: city ?? "",
            country: country ?? "",
          }),
        });
      } catch (e) {
        console.error("HighLevel webhook error:", e);
      }
    }

    // Send welcome email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "AI Hype Academy <noreply@aihype-academy.com>",
          to: email,
          subject: name ? `Dobrodošao, ${name}! 🚀` : "Dobrodošao u AI Hype Academy! 🚀",
          html: `
<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dobrodošao u AI Hype Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0f;min-height:100vh">
    <tr>
      <td align="center" style="padding:48px 16px">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:36px">
              <a href="https://aihype-academy.com" style="text-decoration:none;display:inline-block">
                <img src="https://aihype-academy.com/logo.png" alt="AI Hype Academy" width="160" style="display:block;border:0;max-width:160px;height:auto" />
              </a>
            </td>
          </tr>

          <!-- Top gradient bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#00d4ff,#7c3aed,#ec4899);height:3px;border-radius:3px 3px 0 0;font-size:0;line-height:0">&nbsp;</td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#12121a;border:1px solid #1e1e2e;border-top:none;border-radius:0 0 20px 20px;padding:40px 36px">

              <!-- Heading -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;padding-bottom:14px">
                    ${name ? `Pozdrav, ${name}! 🎉` : "Prijava uspešna! 🎉"}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:15px;color:#888888;line-height:1.75;padding-bottom:32px">
                    Obezbeđeno ti je mesto u <strong style="color:#ffffff">AI Hype Academy</strong>.<br>
                    Bićeš prvi/a obavešten/a čim se kurs otvori za upis.
                  </td>
                </tr>

                <!-- What to expect box -->
                <tr>
                  <td style="background-color:#0d1f2d;border:1px solid #0e3a52;border-radius:14px;padding:22px 24px;margin-bottom:28px">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:11px;font-weight:700;color:#00d4ff;text-transform:uppercase;letter-spacing:2px;padding-bottom:16px">
                          Šta te čeka
                        </td>
                      </tr>
                      ${["8 modula od osnova do monetizacije", "Pristup AI alatima za slike, video i muziku", "Ekskluzivna zajednica kreatora", "Sertifikat po završetku kursa"].map(item => `
                      <tr>
                        <td style="padding-bottom:12px">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:8px;height:8px;background-color:#00d4ff;border-radius:50%;vertical-align:middle">&nbsp;&nbsp;&nbsp;&nbsp;</td>
                              <td style="font-size:14px;color:#cccccc;padding-left:12px;vertical-align:middle">${item}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join("")}
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td style="padding-top:28px" align="center">
                    <a href="https://aihype-academy.com" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:12px;letter-spacing:0.3px">
                      Posetite sajt →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;font-size:12px;color:#444444;line-height:1.8">
              Dobili ste ovaj email jer ste se prijavili na<br>
              <a href="https://aihype-academy.com" style="color:#555555;text-decoration:none">aihype-academy.com</a>
              <br><br>
              © 2025 AI Hype Academy · Sva prava zadržana
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });
      } catch (emailErr) {
        // Email failure shouldn't block the lead save
        console.error("Resend email error:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lead API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
