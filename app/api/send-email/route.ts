import { NextRequest, NextResponse } from "next/server";

type Recipient = { email: string; name: string; table: string; circle: string; qr: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    if (character === "&") return "&amp;";
    if (character === "<") return "&lt;";
    if (character === ">") return "&gt;";
    if (character === "\"") return "&quot;";
    return "&#39;";
  });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Falta configurar RESEND_API_KEY y EMAIL_FROM en Netlify." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    subject?: string;
    message?: string;
    recipients?: Recipient[];
  };

  if (!body.subject?.trim() || !body.message?.trim() || !body.recipients?.length) {
    return NextResponse.json(
      { error: "Faltan asunto, mensaje o destinatarios." },
      { status: 400 }
    );
  }

  const results = [];

  for (const person of body.recipients.slice(0, 50)) {
    if (!person.email) continue;

    const text = body.message
      .replaceAll("[Nombre]", person.name)
      .replaceAll("[Mesa]", person.table)
      .replaceAll("[Círculo]", person.circle)
      .replaceAll("[QR]", person.qr);

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;border:1px solid #d5c08b;background:#fff;padding:34px;color:#18241d">
        <div style="border-bottom:3px solid #b8954d;padding-bottom:18px;margin-bottom:24px">
          <div style="font-size:12px;letter-spacing:2px;color:#9a7734;text-transform:uppercase">Invitación oficial</div>
          <h2 style="margin:7px 0 0;color:#173b2b">II Gran Gala Nacional de los Alguaciles de Chile 2026</h2>
        </div>
        <p style="white-space:pre-line;line-height:1.7">${escapeHtml(text)}</p>
        <div style="margin:24px 0;padding:16px;border:1px solid #e3d5ae;background:#faf7ef;text-align:center">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#8a6a2d">Código único de acreditación</div>
          <div style="font-family:monospace;font-size:18px;font-weight:700;margin-top:8px">${escapeHtml(person.qr)}</div>
        </div>
        <p style="font-size:13px;color:#81652c">25 de noviembre de 2026 · 20:00 horas · Club Palestino</p>
      </div>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [person.email],
        subject: body.subject,
        html,
      }),
    });

    const payload = await response.json();
    results.push({
      email: person.email,
      ok: response.ok,
      id: payload.id,
      error: payload.message,
    });
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;

  return NextResponse.json(
    { sent, failed, results },
    { status: sent > 0 ? 200 : 502 }
  );
}
