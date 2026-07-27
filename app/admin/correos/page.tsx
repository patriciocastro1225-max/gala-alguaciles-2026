"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Mail,
  Send,
  UsersRound,
  X,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

type Campaign = {
  id: number;
  subject: string;
  segment: string;
  recipients: number;
  sentAt: string;
  status: "Enviado" | "Programado";
};

const templates = [
  {
    id: "confirmacion",
    name: "Confirmación de asistencia",
    subject: "Confirmación — II Gran Gala Nacional 2026",
    body: "Estimado/a [Nombre]:\n\nTenemos el agrado de confirmar su asistencia a la II Gran Gala Nacional de los Alguaciles de Chile 2026.\n\nFecha: 25 de noviembre de 2026\nHora: 20:00 horas\nLugar: Club Palestino\nMesa: [Mesa]\n\nAtentamente,\nComité Organizador",
  },
  {
    id: "pago",
    name: "Recordatorio de pago",
    subject: "Recordatorio de pago — Gran Gala Nacional 2026",
    body: "Estimado/a [Nombre]:\n\nSu inscripción se encuentra registrada, pero el pago aún figura pendiente.\n\nAgradecemos regularizarlo para confirmar definitivamente su participación.\n\nAtentamente,\nComité Organizador",
  },
  {
    id: "informacion",
    name: "Información general",
    subject: "Información importante — II Gran Gala Nacional 2026",
    body: "Estimado/a [Nombre]:\n\nCompartimos información importante sobre la II Gran Gala Nacional de los Alguaciles de Chile 2026.\n\nVestimenta: formal\nHora de recepción: 20:00 horas\nEstacionamientos disponibles en el recinto.\n\nAtentamente,\nComité Organizador",
  },
];

const initialCampaigns: Campaign[] = [
  { id: 1, subject: "Confirmación de asistencia", segment: "Confirmados", recipients: 152, sentAt: "20 jul 2026 · 18:30", status: "Enviado" },
  { id: 2, subject: "Recordatorio de pago", segment: "Pendientes", recipients: 34, sentAt: "28 jul 2026 · 10:00", status: "Programado" },
];

export default function EmailsPage() {
  const [templateId, setTemplateId] = useState("confirmacion");
  const [segment, setSegment] = useState("Todos");
  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState(templates[0].body);
  const [history, setHistory] = useState(initialCampaigns);
  const [preview, setPreview] = useState(false);
  const [feedback, setFeedback] = useState("");

  const recipientCount = useMemo(() => {
    if (segment === "Todos") return 186;
    if (segment === "Confirmados") return 152;
    if (segment === "Pendientes") return 34;
    if (segment === "Invitados especiales") return 12;
    if (segment === "Círculo específico") return 24;
    return 0;
  }, [segment]);

  function chooseTemplate(value: string) {
    const selected = templates.find((item) => item.id === value)!;
    setTemplateId(value);
    setSubject(selected.subject);
    setBody(selected.body);
  }

  function sendNow() {
    if (!subject.trim() || !body.trim()) return;
    setHistory([
      {
        id: Date.now(),
        subject,
        segment,
        recipients: recipientCount,
        sentAt: "Ahora",
        status: "Enviado",
      },
      ...history,
    ]);
    setFeedback(`Correo preparado para ${recipientCount} destinatarios.`);
    window.setTimeout(() => setFeedback(""), 3500);
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Comunicaciones</p>
            <h1>Correos y comunicados</h1>
            <p>Envía mensajes segmentados a asistentes, invitados y Círculos.</p>
          </div>
        </section>

        <section className="mailStats">
          <div><Mail /><span>Correos enviados</span><strong>486</strong></div>
          <div><UsersRound /><span>Destinatarios activos</span><strong>186</strong></div>
          <div><CheckCircle2 /><span>Tasa de entrega</span><strong>98,7%</strong></div>
          <div><Clock3 /><span>Programados</span><strong>1</strong></div>
        </section>

        <section className="mailWorkspace">
          <article className="composerPanel">
            <div className="panelHeader">
              <div>
                <p className="panelEyebrow">Nuevo envío</p>
                <h3>Redactar comunicado</h3>
              </div>
              <button className="adminAction" onClick={() => setPreview(true)}>Vista previa</button>
            </div>

            <div className="mailForm">
              <label>
                Plantilla
                <select value={templateId} onChange={(event) => chooseTemplate(event.target.value)}>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Destinatarios
                <select value={segment} onChange={(event) => setSegment(event.target.value)}>
                  <option>Todos</option>
                  <option>Confirmados</option>
                  <option>Pendientes</option>
                  <option>Invitados especiales</option>
                  <option>Círculo específico</option>
                </select>
              </label>

              <div className="recipientBanner">
                <UsersRound size={18} />
                <span>Este mensaje llegará a <strong>{recipientCount}</strong> personas.</span>
              </div>

              <label>
                Asunto
                <input value={subject} onChange={(event) => setSubject(event.target.value)} />
              </label>

              <label>
                Mensaje
                <textarea rows={12} value={body} onChange={(event) => setBody(event.target.value)} />
              </label>

              <div className="mailActions">
                <button className="adminAction">Guardar borrador</button>
                <button className="adminAction primary" onClick={sendNow}>
                  <Send size={17} /> Enviar comunicado
                </button>
              </div>

              {feedback && <p className="sendFeedback">{feedback}</p>}
            </div>
          </article>

          <aside className="templatePanel">
            <p className="panelEyebrow">Variables disponibles</p>
            <h3>Personalización</h3>
            <div className="variableList">
              <span>[Nombre]</span>
              <span>[Mesa]</span>
              <span>[Círculo]</span>
              <span>[QR]</span>
            </div>
            <p>
              Estas variables serán reemplazadas automáticamente con los datos
              de cada asistente cuando el sistema esté conectado a Supabase.
            </p>
          </aside>
        </section>

        <section className="managementPanel emailHistory">
          <div className="panelHeader">
            <div>
              <p className="panelEyebrow">Historial</p>
              <h3>Últimos envíos</h3>
            </div>
          </div>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr><th>Asunto</th><th>Segmento</th><th>Destinatarios</th><th>Fecha</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.subject}</strong></td>
                    <td>{item.segment}</td>
                    <td>{item.recipients}</td>
                    <td>{item.sentAt}</td>
                    <td>
                      <span className={item.status === "Enviado" ? "statusConfirmed" : "statusPending"}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {preview && (
          <div className="modalLayer">
            <div className="formModal previewModal">
              <div className="modalHeader">
                <div>
                  <p className="adminEyebrow">Vista previa</p>
                  <h2>{subject}</h2>
                </div>
                <button onClick={() => setPreview(false)}><X /></button>
              </div>
              <div className="emailPreview">
                <div className="previewBrand">II GRAN GALA NACIONAL 2026</div>
                <p>{body.replaceAll("[Nombre]", "Eduardo Martínez Azócar").replaceAll("[Mesa]", "Mesa 1").replaceAll("[Círculo]", "Círculo Mayor")}</p>
                <div className="previewFooter">25 de noviembre de 2026 · Club Palestino</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
