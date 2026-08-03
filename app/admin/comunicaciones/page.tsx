"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Filter,
  Mail,
  RefreshCw,
  Search,
  Send,
  UsersRound,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendees } from "@/services/attendees";
import { listTables } from "@/services/tables";
import { listCircles } from "@/services/circles";
import {
  createCampaign,
  listCampaigns,
  listDeliveryLogs,
  saveDeliveryLogs,
} from "@/services/communications";

const templates = [
  {
    key: "invitacion",
    name: "Invitación oficial",
    subject: "Invitación — II Gran Gala Nacional de los Alguaciles de Chile 2026",
    body: `Estimado/a [Nombre]:

Tenemos el alto honor de invitarle a la II Gran Gala Nacional de los Alguaciles de Chile 2026.

Fecha: miércoles 25 de noviembre de 2026
Hora: 20:00 horas
Lugar: Club Palestino
Mesa: [Mesa]
Círculo: [Círculo]

Código de acreditación: [QR]

Agradecemos presentar este código al momento de su ingreso.

Atentamente,
Comité Organizador`,
  },
  {
    key: "recordatorio",
    name: "Recordatorio de Gala",
    subject: "Recordatorio — II Gran Gala Nacional 2026",
    body: `Estimado/a [Nombre]:

Le recordamos nuestra cita para la II Gran Gala Nacional de los Alguaciles de Chile 2026.

Fecha: miércoles 25 de noviembre de 2026
Hora: 20:00 horas
Lugar: Club Palestino
Mesa: [Mesa]
Código QR: [QR]

Será un honor contar con su presencia.

Comité Organizador`,
  },
  {
    key: "mesa",
    name: "Confirmación de mesa",
    subject: "Su mesa asignada — Gala Nacional 2026",
    body: `Estimado/a [Nombre]:

Nos permitimos confirmar su ubicación para la Gala.

Mesa: [Mesa]
Círculo: [Círculo]
Código QR: [QR]

Atentamente,
Comité Organizador`,
  },
  {
    key: "confirmacion",
    name: "Confirmación de asistencia",
    subject: "Confirmación de asistencia — Gala Nacional 2026",
    body: `Estimado/a [Nombre]:

Su asistencia a la II Gran Gala Nacional 2026 se encuentra registrada.

Mesa: [Mesa]
Círculo: [Círculo]
Código QR: [QR]

Muchas gracias.
Comité Organizador`,
  },
];

async function load() {
  const [attendees, tables, circles, logs, campaigns] = await Promise.all([
    listAttendees(),
    listTables(),
    listCircles(),
    listDeliveryLogs(),
    listCampaigns(),
  ]);

  return { attendees, tables, circles, logs, campaigns };
}

export default function CommunicationsPage() {
  const source = useAsyncData(load, []);
  const [templateKey, setTemplateKey] = useState("invitacion");
  const template = templates.find((item) => item.key === templateKey) ?? templates[0];

  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);

  const [circleId, setCircleId] = useState("Todos");
  const [tableId, setTableId] = useState("Todos");
  const [attendance, setAttendance] = useState("Todos");
  const [payment, setPayment] = useState("Todos");
  const [mailState, setMailState] = useState("Con correo");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"enviar" | "historial">("enviar");

  const attendees = source.data?.attendees ?? [];
  const circles = source.data?.circles ?? [];
  const tables = source.data?.tables ?? [];
  const logs = source.data?.logs ?? [];
  const campaigns = source.data?.campaigns ?? [];

  const recipients = useMemo(() => {
    const q = query.trim().toLowerCase();

    return attendees.filter((attendee) => {
      if (circleId !== "Todos" && attendee.circle_id !== circleId) return false;
      if (tableId !== "Todos" && attendee.table_id !== tableId) return false;
      if (attendance !== "Todos" && attendee.attendance_status !== attendance) return false;
      if (payment !== "Todos" && attendee.payment_status !== payment) return false;
      if (mailState === "Con correo" && !attendee.email) return false;
      if (mailState === "Sin correo" && attendee.email) return false;

      if (q) {
        const text = `${attendee.full_name} ${attendee.email ?? ""} ${attendee.circles?.name ?? ""} ${attendee.gala_tables?.name ?? ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [attendees, circleId, tableId, attendance, payment, mailState, query]);

  const eligible = recipients.filter((attendee) => attendee.email);

  function chooseTemplate(key: string) {
    const next = templates.find((item) => item.key === key) ?? templates[0];
    setTemplateKey(next.key);
    setSubject(next.subject);
    setBody(next.body);
  }

  async function sendCampaign() {
    if (!eligible.length) {
      setMessage("No hay destinatarios con correo electrónico.");
      return;
    }

    if (!confirm(`¿Enviar ${eligible.length} correo(s) ahora?`)) return;

    setSending(true);
    setMessage("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message: body,
          recipients: eligible.map((attendee) => ({
            attendee_id: attendee.id,
            email: attendee.email,
            name: attendee.full_name,
            table: attendee.gala_tables?.name ?? "Por asignar",
            circle: attendee.circles?.name ?? "Invitado institucional",
            qr: attendee.qr_code,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok && !result.results) {
        throw new Error(result.error ?? "No fue posible realizar el envío.");
      }

      const segment = [
        circleId !== "Todos" ? `Círculo:${circleId}` : null,
        tableId !== "Todos" ? `Mesa:${tableId}` : null,
        attendance !== "Todos" ? `Asistencia:${attendance}` : null,
        payment !== "Todos" ? `Pago:${payment}` : null,
      ].filter(Boolean).join(" · ") || "Selección general";

      const campaign = await createCampaign({
        subject,
        body,
        segment,
        recipients: result.sent ?? 0,
        failed: result.failed ?? 0,
        status: (result.failed ?? 0) === eligible.length ? "Error" : "Enviado",
      });

      const responseByEmail = new Map(
        (result.results ?? []).map((row: any) => [row.email, row])
      );

      await saveDeliveryLogs(
        campaign.id,
        subject,
        templateKey,
        eligible.map((attendee) => {
          const row: any = responseByEmail.get(attendee.email);
          return {
            attendee_id: attendee.id,
            email: attendee.email!,
            name: attendee.full_name,
            ok: Boolean(row?.ok),
            id: row?.id ?? null,
            error: row?.error ?? null,
          };
        })
      );

      await source.reload();
      setMessage(
        `Campaña finalizada: ${result.sent ?? 0} enviados y ${result.failed ?? 0} con error.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminShell>
      <main className="adminPage communications26">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Versión 2.6</p>
            <h1>Comunicaciones avanzadas</h1>
            <p>Segmentación por Círculo, mesa, confirmación y pago, con historial individual de envíos.</p>
          </div>

          <button className="adminAction" onClick={source.reload}>
            <RefreshCw size={17}/> Actualizar
          </button>
        </section>

        <section className="communicationsTabs26">
          <button className={tab === "enviar" ? "active" : ""} onClick={() => setTab("enviar")}>
            <Send size={16}/> Enviar
          </button>
          <button className={tab === "historial" ? "active" : ""} onClick={() => setTab("historial")}>
            <Mail size={16}/> Historial
          </button>
        </section>

        {message && <div className="operationMessage">{message}</div>}
        {source.error && <div className="dataError">{source.error}</div>}

        {tab === "enviar" ? (
          <>
            <section className="communicationFilters26">
              <div className="filterTitle26">
                <Filter size={18}/>
                <span>Seleccionar destinatarios</span>
              </div>

              <label className="searchBox">
                <Search size={17}/>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar invitado, correo, Círculo o mesa..."
                />
              </label>

              <select value={circleId} onChange={(event) => setCircleId(event.target.value)}>
                <option>Todos</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>{circle.name}</option>
                ))}
              </select>

              <select value={tableId} onChange={(event) => setTableId(event.target.value)}>
                <option>Todos</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>Mesa {table.table_number} · {table.name}</option>
                ))}
              </select>

              <select value={attendance} onChange={(event) => setAttendance(event.target.value)}>
                <option>Todos</option>
                <option>Confirmado</option>
                <option>Pendiente</option>
                <option>Cancelado</option>
              </select>

              <select value={payment} onChange={(event) => setPayment(event.target.value)}>
                <option>Todos</option>
                <option>Pagado</option>
                <option>Pendiente</option>
                <option>Parcial</option>
                <option>Invitación</option>
              </select>

              <select value={mailState} onChange={(event) => setMailState(event.target.value)}>
                <option>Con correo</option>
                <option>Sin correo</option>
                <option>Todos</option>
              </select>
            </section>

            <section className="communicationSummary26">
              <div><UsersRound/><span>Seleccionados</span><strong>{recipients.length}</strong></div>
              <div><Mail/><span>Con correo</span><strong>{eligible.length}</strong></div>
              <div><CircleAlert/><span>Sin correo</span><strong>{recipients.length - eligible.length}</strong></div>
            </section>

            <section className="communicationWorkspace26">
              <article className="composer26">
                <div className="composerHeader26">
                  <div>
                    <p className="panelEyebrow">Mensaje</p>
                    <h2>Preparar comunicación</h2>
                  </div>

                  <select value={templateKey} onChange={(event) => chooseTemplate(event.target.value)}>
                    {templates.map((item) => (
                      <option key={item.key} value={item.key}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <label>
                  Asunto
                  <input value={subject} onChange={(event) => setSubject(event.target.value)}/>
                </label>

                <label>
                  Mensaje
                  <textarea rows={16} value={body} onChange={(event) => setBody(event.target.value)}/>
                </label>

                <div className="variables26">
                  <span>[Nombre]</span>
                  <span>[Mesa]</span>
                  <span>[Círculo]</span>
                  <span>[QR]</span>
                </div>

                <button
                  className="adminAction primary sendCampaign26"
                  disabled={sending || !eligible.length}
                  onClick={sendCampaign}
                >
                  <Send size={18}/>
                  {sending ? "Enviando…" : `Enviar a ${eligible.length} destinatario(s)`}
                </button>
              </article>

              <aside className="recipientsPreview26">
                <p className="panelEyebrow">Vista previa</p>
                <h2>Destinatarios</h2>

                <div className="recipientList26">
                  {recipients.slice(0,100).map((attendee) => (
                    <div key={attendee.id}>
                      <span>
                        <strong>{attendee.full_name}</strong>
                        <small>
                          {attendee.circles?.name ?? "Sin círculo"} · {attendee.gala_tables?.name ?? "Sin mesa"}
                        </small>
                      </span>
                      {attendee.email ? (
                        <CheckCircle2 className="deliveryOk26" size={17}/>
                      ) : (
                        <CircleAlert className="deliveryWarn26" size={17}/>
                      )}
                    </div>
                  ))}
                  {recipients.length > 100 && (
                    <p>Mostrando los primeros 100 de {recipients.length}.</p>
                  )}
                </div>
              </aside>
            </section>
          </>
        ) : (
          <section className="historyGrid26">
            <article className="historyPanel26">
              <p className="panelEyebrow">Campañas</p>
              <h2>Historial de comunicaciones</h2>

              <div className="campaignList26">
                {campaigns.map((campaign) => (
                  <div key={campaign.id}>
                    <span>
                      <strong>{campaign.subject}</strong>
                      <small>{campaign.segment}</small>
                    </span>
                    <span>
                      <strong>{campaign.recipients} enviados</strong>
                      <small>{campaign.failed} error(es)</small>
                    </span>
                    <small>
                      {campaign.sent_at
                        ? new Date(campaign.sent_at).toLocaleString("es-CL")
                        : "Sin fecha"}
                    </small>
                  </div>
                ))}
              </div>
            </article>

            <article className="historyPanel26">
              <p className="panelEyebrow">Entregas individuales</p>
              <h2>Últimos envíos</h2>

              <div className="deliveryList26">
                {logs.map((log) => (
                  <div key={log.id}>
                    <span>
                      <strong>{log.recipient_name ?? log.recipient_email}</strong>
                      <small>{log.recipient_email}</small>
                    </span>
                    <span className={log.status === "Enviado" ? "deliverySent26" : "deliveryError26"}>
                      {log.status}
                    </span>
                    <small>{new Date(log.sent_at).toLocaleString("es-CL")}</small>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
      </main>
    </AdminShell>
  );
}
