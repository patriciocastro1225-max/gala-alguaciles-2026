"use client";

import { useMemo, useState } from "react";
import { Mail, Send, UsersRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendees } from "@/services/attendees";
import { saveEmailCampaign } from "@/services/emailCampaigns";

const templates = [
  {
    id: "invitacion",
    name: "Invitación con QR",
    subject: "Invitación — II Gran Gala Nacional 2026",
    body: "Estimado/a [Nombre]:\n\nTenemos el alto honor de invitarle a la II Gran Gala Nacional de los Alguaciles de Chile 2026.\n\nFecha: 25 de noviembre de 2026\nHora: 20:00 horas\nLugar: Club Palestino\nMesa: [Mesa]\nCírculo: [Círculo]\nCódigo QR: [QR]\n\nPresente su código QR al momento de la acreditación.\n\nAtentamente,\nComité Organizador",
  },
  {
    id: "confirmacion",
    name: "Confirmación",
    subject: "Confirmación de asistencia — Gala 2026",
    body: "Estimado/a [Nombre]:\n\nSu asistencia se encuentra confirmada.\n\nMesa: [Mesa]\nCírculo: [Círculo]\nCódigo de acreditación: [QR]\n\nAtentamente,\nComité Organizador",
  },
  {
    id: "recordatorio",
    name: "Recordatorio",
    subject: "Recordatorio — Gala Nacional 2026",
    body: "Estimado/a [Nombre]:\n\nLe recordamos que la Gala se realizará el 25 de noviembre de 2026 a las 20:00 horas en el Club Palestino.\n\nMesa: [Mesa]\nCódigo: [QR]\n\nAtentamente,\nComité Organizador",
  },
];

export default function EmailsPage() {
  const source = useAsyncData(listAttendees, []);
  const params = useSearchParams();
  const attendeeId = params.get("attendee");
  const [segment, setSegment] = useState("Confirmados");
  const [template, setTemplate] = useState(templates[0]);
  const [subject, setSubject] = useState(template.subject);
  const [message, setMessage] = useState(template.body);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  const recipients = useMemo(() => {
    const rows = source.data ?? [];
    if (attendeeId) return rows.filter((a) => a.id === attendeeId && a.email);
    return rows.filter(
      (a) =>
        a.email &&
        (segment === "Todos" ||
          (segment === "Confirmados" && a.attendance_status === "Confirmado") ||
          (segment === "Pendientes" && a.attendance_status === "Pendiente"))
    );
  }, [source.data, segment, attendeeId]);

  function choose(id: string) {
    const t = templates.find((x) => x.id === id)!;
    setTemplate(t);
    setSubject(t.subject);
    setMessage(t.body);
  }

  async function send() {
    setSending(true);
    setFeedback("");
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          recipients: recipients.map((a) => ({
            email: a.email,
            name: a.full_name,
            table: a.gala_tables?.name ?? "Por asignar",
            circle: a.circles?.name ?? "Invitado institucional",
            qr: a.qr_code,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No fue posible enviar.");

      try {
        await saveEmailCampaign({
          subject,
          body: message,
          segment: attendeeId ? "Individual" : segment,
          recipients: data.sent,
          failed: data.failed,
          status: data.failed === recipients.length ? "Error" : "Enviado",
        });
      } catch {
        // El envío ya ocurrió; no lo repetimos si falla solamente el historial.
      }

      setFeedback(`Envío terminado: ${data.sent} enviados y ${data.failed} con error.`);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Error de envío.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Comunicaciones reales</p>
            <h1>Correos e invitaciones</h1>
            <p>Envío mediante Resend con nombre, mesa personalizada, círculo y código QR.</p>
          </div>
        </section>

        <section className="mailStats">
          <div><Mail /><span>Proveedor</span><strong>Resend</strong></div>
          <div><UsersRound /><span>Con correo</span><strong>{(source.data ?? []).filter((a) => a.email).length}</strong></div>
          <div><UsersRound /><span>Seleccionados</span><strong>{recipients.length}</strong></div>
        </section>

        <section className="mailWorkspace">
          <article className="composerPanel">
            <div className="mailForm">
              <label>
                Plantilla
                <select value={template.id} onChange={(e) => choose(e.target.value)}>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>

              {attendeeId ? (
                <div className="recipientBanner">
                  <UsersRound size={18} />
                  <span>Envío individual a <strong>{recipients[0]?.full_name ?? "asistente sin correo"}</strong>.</span>
                </div>
              ) : (
                <label>
                  Destinatarios
                  <select value={segment} onChange={(e) => setSegment(e.target.value)}>
                    <option>Todos</option>
                    <option>Confirmados</option>
                    <option>Pendientes</option>
                  </select>
                </label>
              )}

              <div className="recipientBanner">
                <UsersRound size={18} />
                <span>Se enviará a <strong>{recipients.length}</strong> persona(s) con correo registrado.</span>
              </div>

              <label>Asunto<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
              <label>Mensaje<textarea rows={14} value={message} onChange={(e) => setMessage(e.target.value)} /></label>

              <button className="adminAction primary" disabled={sending || !recipients.length} onClick={send}>
                <Send size={17} />{sending ? "Enviando..." : "Enviar ahora"}
              </button>

              {feedback && <p className="sendFeedback">{feedback}</p>}
            </div>
          </article>

          <aside className="templatePanel">
            <p className="panelEyebrow">Variables</p>
            <h3>Datos automáticos</h3>
            <div className="variableList">
              <span>[Nombre]</span><span>[Mesa]</span><span>[Círculo]</span><span>[QR]</span>
            </div>
            <p>Requiere RESEND_API_KEY y EMAIL_FROM configuradas en Netlify.</p>
            <p>Por seguridad, cada operación procesa hasta 50 correos.</p>
          </aside>
        </section>
      </main>
    </AdminShell>
  );
}
