"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Mail,
  Pencil,
  Search,
  TableProperties,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendees } from "@/services/attendees";
import { listTables } from "@/services/tables";
import { listCircles } from "@/services/circles";
import { updateAttendeeProfile } from "@/services/guestManagement";
import type { Attendee } from "@/types/database";

async function load() {
  const [attendees, tables, circles] = await Promise.all([
    listAttendees(),
    listTables(),
    listCircles(),
  ]);
  return { attendees, tables, circles };
}

export default function GuestManagementPage() {
  const source = useAsyncData(load, []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<Attendee | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const attendees = source.data?.attendees ?? [];
  const tables = source.data?.tables ?? [];
  const circles = source.data?.circles ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendees.filter((a) => {
      const matchQuery =
        !q ||
        a.full_name.toLowerCase().includes(q) ||
        (a.email ?? "").toLowerCase().includes(q) ||
        (a.phone ?? "").toLowerCase().includes(q) ||
        (a.circles?.name ?? "").toLowerCase().includes(q) ||
        (a.gala_tables?.name ?? "").toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (filter === "Todos") return true;
      if (filter === "Confirmados") return a.attendance_status === "Confirmado";
      if (filter === "Sin mesa") return !a.table_id;
      if (filter === "Pendientes pago") return a.payment_status === "Pendiente";
      if (filter === "Sin correo") return !a.email;
      if (filter === "Sin QR") return !a.qr_code;
      return true;
    });
  }, [attendees, query, filter]);

  const alerts = useMemo(() => {
    return {
      noTable: attendees.filter((a) => a.attendance_status === "Confirmado" && !a.table_id).length,
      pendingPayment: attendees.filter((a) => a.payment_status === "Pendiente").length,
      noEmail: attendees.filter((a) => !a.email).length,
      noQr: attendees.filter((a) => !a.qr_code).length,
    };
  }, [attendees]);

  function openEdit(attendee: Attendee) {
    setSelected(attendee);
    setForm({
      full_name: attendee.full_name ?? "",
      email: attendee.email ?? "",
      phone: attendee.phone ?? "",
      companion_name: attendee.companion_name ?? "",
      institution: attendee.institution ?? "",
      position_title: attendee.position_title ?? "",
      protocol_category: attendee.protocol_category ?? "",
      payment_status: attendee.payment_status,
      attendance_status: attendee.attendance_status,
      dietary_notes: attendee.dietary_notes ?? "",
      notes: attendee.notes ?? "",
      table_id: attendee.table_id ?? "",
      circle_id: attendee.circle_id ?? "",
    });
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMessage("");

    try {
      await updateAttendeeProfile(selected.id, {
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        companion_name: form.companion_name.trim() || null,
        institution: form.institution.trim() || null,
        position_title: form.position_title.trim() || null,
        protocol_category: form.protocol_category.trim() || null,
        payment_status: form.payment_status,
        attendance_status: form.attendance_status,
        dietary_notes: form.dietary_notes.trim() || null,
        notes: form.notes.trim() || null,
        table_id: form.table_id || null,
        circle_id: form.circle_id || null,
      });

      setSelected(null);
      await source.reload();
      setMessage("Ficha del invitado actualizada correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <main className="adminPage guestManagementPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Versión 2.2</p>
            <h1>Gestión avanzada de invitados</h1>
            <p>Ficha completa, alertas operacionales y control de mesa, pago, confirmación y QR.</p>
          </div>
        </section>

        <section className="guestAlertGrid22">
          <button onClick={() => setFilter("Sin mesa")}>
            <TableProperties />
            <span>Confirmados sin mesa</span>
            <strong>{alerts.noTable}</strong>
          </button>
          <button onClick={() => setFilter("Pendientes pago")}>
            <CircleDollarSign />
            <span>Pago pendiente</span>
            <strong>{alerts.pendingPayment}</strong>
          </button>
          <button onClick={() => setFilter("Sin correo")}>
            <Mail />
            <span>Sin correo</span>
            <strong>{alerts.noEmail}</strong>
          </button>
          <button onClick={() => setFilter("Sin QR")}>
            <AlertTriangle />
            <span>Sin QR</span>
            <strong>{alerts.noQr}</strong>
          </button>
        </section>

        <section className="guestToolbar22">
          <label className="searchBox">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar nombre, correo, teléfono, círculo o mesa..."
            />
          </label>

          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option>Todos</option>
            <option>Confirmados</option>
            <option>Sin mesa</option>
            <option>Pendientes pago</option>
            <option>Sin correo</option>
            <option>Sin QR</option>
          </select>
        </section>

        {message && <div className="operationMessage">{message}</div>}
        {source.error && <div className="dataError">{source.error}</div>}

        <section className="guestTable22">
          <div className="guestTableHeader22">
            <span>Invitado</span>
            <span>Círculo</span>
            <span>Mesa</span>
            <span>Asistencia</span>
            <span>Pago</span>
            <span>QR</span>
            <span></span>
          </div>

          {filtered.map((attendee) => (
            <div className="guestTableRow22" key={attendee.id}>
              <div>
                <strong>{attendee.full_name}</strong>
                <small>{attendee.email ?? "Sin correo"} · {attendee.phone ?? "Sin teléfono"}</small>
              </div>

              <span>{attendee.circles?.name ?? "Sin círculo"}</span>
              <span>{attendee.gala_tables?.name ?? "Sin mesa"}</span>

              <span className={`statusPill22 ${attendee.attendance_status.toLowerCase()}`}>
                {attendee.attendance_status}
              </span>

              <span className={`statusPill22 ${attendee.payment_status.toLowerCase().replace("ó","o")}`}>
                {attendee.payment_status}
              </span>

              <span>
                {attendee.qr_code ? (
                  <CheckCircle2 className="ok22" size={18} />
                ) : (
                  <AlertTriangle className="warn22" size={18} />
                )}
              </span>

              <button className="adminAction compactAction" onClick={() => openEdit(attendee)}>
                <Pencil size={15} /> Editar
              </button>
            </div>
          ))}
        </section>

        {selected && (
          <div className="modalLayer">
            <div className="formModal guestProfileModal22">
              <div className="modalHeader">
                <div>
                  <p className="adminEyebrow">Ficha del invitado</p>
                  <h2>{selected.full_name}</h2>
                </div>
                <button onClick={() => setSelected(null)}><X /></button>
              </div>

              <div className="guestProfileSummary22">
                <div>
                  <UserCheck />
                  <span>Check-in</span>
                  <strong>{selected.checked_in ? "Acreditado" : "Pendiente"}</strong>
                </div>
                <div>
                  <TableProperties />
                  <span>Mesa actual</span>
                  <strong>{selected.gala_tables?.name ?? "Sin mesa"}</strong>
                </div>
                <div>
                  <UsersRound />
                  <span>Círculo</span>
                  <strong>{selected.circles?.name ?? "Sin círculo"}</strong>
                </div>
              </div>

              <div className="formGrid">
                <label>Nombre completo<input value={form.full_name} onChange={(e) => setForm({...form, full_name:e.target.value})}/></label>
                <label>Correo<input value={form.email} onChange={(e) => setForm({...form, email:e.target.value})}/></label>
                <label>Teléfono<input value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})}/></label>
                <label>Acompañante<input value={form.companion_name} onChange={(e) => setForm({...form, companion_name:e.target.value})}/></label>
                <label>Institución<input value={form.institution} onChange={(e) => setForm({...form, institution:e.target.value})}/></label>
                <label>Cargo<input value={form.position_title} onChange={(e) => setForm({...form, position_title:e.target.value})}/></label>
                <label>Categoría protocolar<input value={form.protocol_category} onChange={(e) => setForm({...form, protocol_category:e.target.value})}/></label>

                <label>Círculo
                  <select value={form.circle_id} onChange={(e) => setForm({...form, circle_id:e.target.value})}>
                    <option value="">Sin círculo</option>
                    {circles.map((circle) => <option key={circle.id} value={circle.id}>{circle.name}</option>)}
                  </select>
                </label>

                <label>Mesa
                  <select value={form.table_id} onChange={(e) => setForm({...form, table_id:e.target.value})}>
                    <option value="">Sin mesa</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.table_number}. {table.name} ({table.occupied ?? 0}/{table.capacity})
                      </option>
                    ))}
                  </select>
                </label>

                <label>Confirmación
                  <select value={form.attendance_status} onChange={(e) => setForm({...form, attendance_status:e.target.value})}>
                    <option>Confirmado</option>
                    <option>Pendiente</option>
                    <option>Cancelado</option>
                  </select>
                </label>

                <label>Pago
                  <select value={form.payment_status} onChange={(e) => setForm({...form, payment_status:e.target.value})}>
                    <option>Pagado</option>
                    <option>Pendiente</option>
                    <option>Parcial</option>
                    <option>Invitación</option>
                  </select>
                </label>

                <label className="fullField">Restricciones alimentarias
                  <textarea rows={3} value={form.dietary_notes} onChange={(e) => setForm({...form, dietary_notes:e.target.value})}/>
                </label>

                <label className="fullField">Observaciones
                  <textarea rows={4} value={form.notes} onChange={(e) => setForm({...form, notes:e.target.value})}/>
                </label>
              </div>

              <div className="modalActions">
                <button className="adminAction" onClick={() => setSelected(null)}>Cancelar</button>
                <button className="adminAction primary" disabled={saving} onClick={save}>
                  {saving ? "Guardando…" : "Guardar ficha"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
