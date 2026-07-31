"use client";

import { useMemo, useState } from "react";
import { Pencil, RefreshCw, Search, UserRoundCheck, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { assignTable, listTableAttendees, listTables, updateTable } from "@/services/tables";
import type { Attendee, GalaTable } from "@/types/database";

async function load() {
  const [tables, attendees] = await Promise.all([listTables(), listTableAttendees()]);
  return { tables, attendees };
}

const defaultForm = {
  name: "",
  capacity: 10,
  zone: "General",
  status: "Disponible",
  responsible: "",
  notes: "",
  location: "",
  color: "#C8A14D",
};

export default function TablesPage() {
  const source = useAsyncData(load, []);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(defaultForm);
  const [saving, setSaving] = useState(false);

  const tables = source.data?.tables ?? [];
  const attendees = source.data?.attendees ?? [];
  const active = tables.find((table) => table.id === selected) ?? tables[0];

  const assigned = useMemo(
    () => attendees.filter((attendee) => attendee.table_id === active?.id),
    [attendees, active]
  );

  const unassigned = useMemo(
    () =>
      attendees.filter(
        (attendee) =>
          !attendee.table_id &&
          attendee.full_name.toLowerCase().includes(query.toLowerCase())
      ),
    [attendees, query]
  );

  async function move(attendee: Attendee, table: GalaTable | null) {
    try {
      setBusy(attendee.id);
      setMessage("");
      await assignTable(attendee.id, table?.id ?? null);
      await source.reload();
      setMessage(
        table
          ? `${attendee.full_name} fue asignado a ${table.name}.`
          : `${attendee.full_name} quedó sin mesa.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible actualizar.");
    } finally {
      setBusy("");
    }
  }

  function openEdit(table: GalaTable) {
    setSelected(table.id);
    setForm({
      name: table.name,
      capacity: table.capacity,
      zone: table.zone,
      status: table.status ?? "Disponible",
      responsible: table.responsible ?? "",
      notes: table.notes ?? "",
      location: table.location ?? "",
      color: table.color ?? "#C8A14D",
    });
    setModal(true);
  }

  async function saveTableChanges() {
    if (!active || !form.name.trim()) return;
    if (form.capacity < assigned.length) {
      setMessage(`La capacidad no puede ser menor que los ${assigned.length} asistentes ya asignados.`);
      return;
    }

    setSaving(true);
    try {
      await updateTable(active.id, {
        name: form.name.trim(),
        capacity: Number(form.capacity),
        zone: form.zone,
        status: form.status,
        responsible: form.responsible.trim() || null,
        notes: form.notes.trim() || null,
        location: form.location.trim() || null,
        color: form.color || "#C8A14D",
      });
      setModal(false);
      await source.reload();
      setMessage(`La mesa fue actualizada como “${form.name.trim()}”.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar la mesa.");
    } finally {
      setSaving(false);
    }
  }

  const totals = {
    capacity: tables.reduce((sum, table) => sum + table.capacity, 0),
    occupied: attendees.filter((attendee) => attendee.table_id).length,
  };

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Mesas personalizables</p>
            <h1>Salón y mesas</h1>
            <p>Cambia nombres, capacidad, zona, color, ubicación y observaciones.</p>
          </div>
          <button className="adminAction" onClick={source.reload}>
            <RefreshCw size={18} /> Actualizar
          </button>
        </section>

        <section className="summaryStrip tableSummary">
          <div><span>Mesas</span><strong>{tables.length}</strong></div>
          <div><span>Capacidad</span><strong>{totals.capacity}</strong></div>
          <div><span>Asignados</span><strong>{totals.occupied}</strong></div>
          <div><span>Disponibles</span><strong>{Math.max(0, totals.capacity - totals.occupied)}</strong></div>
        </section>

        {message && <div className="operationMessage">{message}</div>}
        {source.error && <div className="dataError">{source.error}</div>}

        <section className="liveFloorWorkspace">
          <div className="liveFloor">
            <div className="stage">
              <span>ESCENARIO PRINCIPAL</span>
              <strong>II GRAN GALA NACIONAL 2026</strong>
            </div>

            <div className="liveTableGrid">
              {tables.map((table) => {
                const count = attendees.filter((attendee) => attendee.table_id === table.id).length;
                const percentage = Math.min(100, (count / table.capacity) * 100);
                return (
                  <button
                    key={table.id}
                    className={`${active?.id === table.id ? "active " : ""}${count >= table.capacity ? "full" : percentage >= 70 ? "limited" : ""}`}
                    onClick={() => setSelected(table.id)}
                    style={{ borderTopColor: table.color ?? "#C8A14D" }}
                  >
                    <span>Mesa {table.table_number}</span>
                    <strong>{table.name}</strong>
                    <small>{count} / {table.capacity}</small>
                    <i><b style={{ width: `${percentage}%`, background: table.color ?? "#C8A14D" }} /></i>
                  </button>
                );
              })}
            </div>

            <div className="floorFooter">
              <span>Acceso principal</span>
              <span>Recepción y acreditación</span>
            </div>
          </div>

          <aside className="tableInspector">
            <div className="tableInspectorHeading">
              <div>
                <p className="panelEyebrow">Mesa seleccionada</p>
                <h2>{active?.name ?? "Sin mesas"}</h2>
              </div>
              {active && (
                <button className="adminAction compactAction" onClick={() => openEdit(active)}>
                  <Pencil size={16} /> Editar
                </button>
              )}
            </div>

            <p>{active?.zone} · {assigned.length}/{active?.capacity ?? 0} cupos</p>
            {active?.location && <p className="tableMeta">Ubicación: {active.location}</p>}
            {active?.responsible && <p className="tableMeta">Responsable: {active.responsible}</p>}
            {active?.notes && <p className="tableNotes">{active.notes}</p>}

            <div className="assignedGuests">
              {assigned.map((attendee) => (
                <div key={attendee.id}>
                  <span>
                    <strong>{attendee.full_name}</strong>
                    <small>{attendee.circles?.name ?? "Sin círculo"}</small>
                  </span>
                  <button disabled={busy === attendee.id} onClick={() => move(attendee, null)}>
                    Retirar
                  </button>
                </div>
              ))}
            </div>

            <hr />

            <label className="searchBox compact">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar sin mesa..."
              />
            </label>

            <div className="unassignedGuests">
              {unassigned.slice(0, 12).map((attendee) => (
                <button
                  key={attendee.id}
                  disabled={!active || assigned.length >= active.capacity || busy === attendee.id}
                  onClick={() => active && move(attendee, active)}
                >
                  <UserRoundCheck size={16} />
                  <span>
                    {attendee.full_name}
                    <small>{attendee.circles?.name ?? "Sin círculo"}</small>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </section>

        {modal && active && (
          <div className="modalLayer">
            <div className="formModal">
              <div className="modalHeader">
                <div>
                  <p className="adminEyebrow">Mesa {active.table_number}</p>
                  <h2>Editar mesa</h2>
                </div>
                <button onClick={() => setModal(false)}><X /></button>
              </div>

              <div className="formGrid">
                <label>
                  Nombre visible
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label>
                  Capacidad
                  <input type="number" min={assigned.length || 1} value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} />
                </label>
                <label>
                  Zona
                  <select value={form.zone} onChange={(event) => setForm({ ...form, zone: event.target.value })}>
                    <option>Protocolar</option>
                    <option>Autoridades</option>
                    <option>Central</option>
                    <option>General</option>
                    <option>Reserva</option>
                  </select>
                </label>
                <label>
                  Estado
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    <option>Disponible</option>
                    <option>Reservada</option>
                    <option>Cerrada</option>
                  </select>
                </label>
                <label>
                  Color
                  <input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
                </label>
                <label>
                  Ubicación
                  <input placeholder="Ej.: Frente al escenario" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
                </label>
                <label>
                  Responsable
                  <input value={form.responsible} onChange={(event) => setForm({ ...form, responsible: event.target.value })} />
                </label>
                <label className="fullField">
                  Observaciones
                  <textarea rows={4} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
                </label>
              </div>

              <div className="modalActions">
                <button className="adminAction" onClick={() => setModal(false)}>Cancelar</button>
                <button className="adminAction primary" disabled={saving} onClick={saveTableChanges}>
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
