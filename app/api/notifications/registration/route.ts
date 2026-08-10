import { NextResponse } from "next/server";

export const runtime = "nodejs";

type NotificationPayload = {
  type?: "registration" | "payment_receipt";
  registration_code?: string;
  portal_token?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  circle_name?: string;
  companion_name?: string;
  people?: number;
  amount?: number;
  payment_method?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function recipientsFromEnvironment() {
  return String(process.env.ORGANIZER_EMAILS || "")
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function verifyPortal(registrationCode: string, portalToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  const response = await fetch(`${url}/rest/v1/rpc/get_guest_portal`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_registration_code: registrationCode,
      p_portal_token: portalToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) return false;
  const data = await response.json().catch(() => null);
  return Boolean(data);
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "RESEND_API_KEY no configurada." }, { status: 500 });

    const recipients = recipientsFromEnvironment();
    if (!recipients.length) return NextResponse.json({ ok: false, error: "ORGANIZER_EMAILS no configurado." }, { status: 500 });

    const payload = (await request.json()) as NotificationPayload;
    const registrationCode = String(payload.registration_code || "").trim();
    const portalToken = String(payload.portal_token || "").trim();
    if (!registrationCode || !portalToken) return NextResponse.json({ ok: false, error: "Datos de inscripción incompletos." }, { status: 400 });

    const verified = await verifyPortal(registrationCode, portalToken);
    if (!verified) return NextResponse.json({ ok: false, error: "Inscripción no válida." }, { status: 403 });

    const type = payload.type === "payment_receipt" ? "payment_receipt" : "registration";
    const fullName = escapeHtml(payload.full_name || "SIN NOMBRE");
    const email = escapeHtml(payload.email || "NO INFORMADO");
    const phone = escapeHtml(payload.phone || "NO INFORMADO");
    const circle = escapeHtml(payload.circle_name || "POR INFORMAR");
    const companion = escapeHtml(payload.companion_name || "NO REGISTRADO");
    const people = Math.max(1, Math.min(2, Number(payload.people) || 1));
    const amount = Number(payload.amount) || 0;
    const paymentMethod = escapeHtml(payload.payment_method || "PENDIENTE");
    const code = escapeHtml(registrationCode);

    const subject = type === "payment_receipt"
      ? `NUEVO COMPROBANTE DE PAGO · ${registrationCode}`
      : `NUEVA INSCRIPCIÓN · ${registrationCode} · ${String(payload.full_name || "").toUpperCase()}`;

    const headline = type === "payment_receipt"
      ? "NUEVO COMPROBANTE PENDIENTE DE VALIDACIÓN"
      : "NUEVA INSCRIPCIÓN RECIBIDA";

    const intro = type === "payment_receipt"
      ? "El invitado cargó correctamente un comprobante de transferencia. El pago debe ser revisado por el comité organizador."
      : "Se ha registrado una nueva inscripción en el Portal Oficial de la II Gran Gala Nacional 2026.";

    const html = `
      <div style="margin:0;padding:32px;background:#071d16;font-family:Arial,Helvetica,sans-serif;color:#17382d">
        <div style="max-width:720px;margin:0 auto;background:#fbf8ef;border:1px solid #d1ae56;border-radius:14px;overflow:hidden">
          <div style="padding:24px 30px;background:#0a2d22;color:#fff">
            <div style="font-size:12px;letter-spacing:2px;color:#e2c77d">II GRAN GALA NACIONAL · 2026</div>
            <h1 style="margin:10px 0 0;font-size:24px">${headline}</h1>
          </div>
          <div style="padding:28px 30px">
            <p style="font-size:16px;line-height:1.6">${intro}</p>
            <table style="width:100%;border-collapse:collapse;margin-top:22px;font-size:15px">
              <tr><td style="padding:10px 0;border-bottom:1px solid #e7dfcb"><strong>NOMBRE</strong></td><td style="padding:10px 0;border-bottom:1px solid #e7dfcb;text-align:right">${fullName}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e7dfcb"><strong>CÓDIGO</strong></td><td style="padding:10px 0;border-bottom:1px solid #e7dfcb;text-align:right">${code}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e7dfcb"><strong>CÍRCULO</strong></td><td style="padding:10px 0;border-bottom:1px solid #e7dfcb;text-align:right">${circle}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e7dfcb"><strong>CORREO</strong></td><td style="padding:10px 0;border-bottom:1px solid #e7dfcb;text-align:right">${email}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e7dfcb"><strong>TELÉFONO</strong></td><td style="padding:10px 0;border-bottom:1px solid #e7dfcb;text-align:right">${phone}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e7dfcb"><strong>ACOMPAÑANTE</strong></td><td style="padding:10px 0;border-bottom:1px solid #e7dfcb;text-align:right">${companion}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e7dfcb"><strong>PERSONAS</strong></td><td style="padding:10px 0;border-bottom:1px solid #e7dfcb;text-align:right">${people}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #e7dfcb"><strong>MONTO ESPERADO</strong></td><td style="padding:10px 0;border-bottom:1px solid #e7dfcb;text-align:right">${money(amount)}</td></tr>
              <tr><td style="padding:10px 0"><strong>PAGO</strong></td><td style="padding:10px 0;text-align:right">${paymentMethod}</td></tr>
            </table>
            <div style="margin-top:24px;padding:16px;background:#f4ecd6;border-left:4px solid #c7a347">
              Ingrese al panel administrativo de <strong>grangala.cl</strong> para revisar y gestionar esta inscripción.
            </div>
          </div>
          <div style="padding:16px 30px;background:#efe7d2;font-size:12px;color:#68776f">Mensaje automático del sistema de la II Gran Gala Nacional 2026.</div>
        </div>
      </div>`;

    const from = process.env.GRANGALA_EMAIL_FROM || "Gran Gala 2026 <inscripciones@grangala.cl>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        html,
        reply_to: payload.email || undefined,
      }),
    });

    const resendResult = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Resend error", resendResult);
      return NextResponse.json({ ok: false, error: "No fue posible enviar la notificación." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, id: resendResult?.id || null });
  } catch (error) {
    console.error("Registration notification error", error);
    return NextResponse.json({ ok: false, error: "Error interno de notificación." }, { status: 500 });
  }
}
