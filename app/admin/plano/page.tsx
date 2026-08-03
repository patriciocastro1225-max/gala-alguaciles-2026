"use client";

import {
  type DragEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Grip,
  RefreshCw,
  RotateCcw,
  Save,
  UsersRound,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  assignTable,
  listTableAttendees,
  listTables,
  updateTablePositions,
} from "@/services/tables";
import type { Attendee, GalaTable } from "@/types/database";

async function load() {
  const [tables, attendees] = await Promise.all([
    listTables(),
    listTableAttendees(),
  ]);
  return { tables, attendees };
}

type Position = { x: number; y: number };
type Positions = Record<string, Position>;

function initialPosition(table: GalaTable): Position {
  return {
    x: Number(table.x_pos ?? (7 + ((table.table_number - 1) % 5) * 21)),
    y: Number(table.y_pos ?? (22 + Math.floor((table.table_number - 1) / 5) * 15)),
  };
}

export default function FloorPlanPage() {
  const source = useAsyncData(load, []);
  const floorRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState("");
  const [positions, setPositions] = useState<Positions>({});
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [movingGuest, setMovingGuest] = useState("");

  const tables = source.data?.tables ?? [];
  const attendees = source.data?.attendees ?? [];

  useEffect(() => {
    if (!tables.length || dirty) return;
    const next: Positions = {};
    tables.forEach((table) => {
      next[table.id] = initialPosition(table);
    });
    setPositions(next);
    if (!selected) setSelected(tables[0]?.id ?? "");
  }, [tables, dirty, selected]);

  const active = tables.find((table) => table.id === selected) ?? tables[0];

  const assigned = useMemo(
    () => attendees.filter((attendee) => attendee.table_id === active?.id),
    [attendees, active]
  );

  const metrics = useMemo(() => {
    const confirmed = attendees.filter((a) => a.attendance_status === "Confirmado").length;
    const checked = attendees.filter((a) => a.checked_in).length;
    return {
      confirmed,
      checked,
      assigned: attendees.filter((a) => a.table_id).length,
    };
  }, [attendees]);

  function beginMove(event: PointerEvent<HTMLButtonElement>, table: GalaTable) {
    if (!floorRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(table.id);
    setDraggingTable(table.id);
  }

  function moveTable(event: PointerEvent<HTMLButtonElement>, table: GalaTable) {
    if (draggingTable !== table.id || !floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPositions((current) => ({
      ...current,
      [table.id]: {
        x: Math.max(2, Math.min(92, x)),
        y: Math.max(12, Math.min(88, y)),
      },
    }));
    setDirty(true);
  }

  function endMove(event: PointerEvent<HTMLButtonElement>) {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    setDraggingTable(null);
  }

  async function saveLayout() {
    setSaving(true);
    setMessage("");
    try {
      await updateTablePositions(
        tables.map((table) => ({
          id: table.id,
          x_pos: positions[table.id]?.x ?? initialPosition(table).x,
          y_pos: positions[table.id]?.y ?? initialPosition(table).y,
        }))
      );
      setDirty(false);
      await source.reload();
      setMessage("Plano guardado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar el plano.");
    } finally {
      setSaving(false);
    }
  }

  function resetLocalLayout() {
    const next: Positions = {};
    tables.forEach((table) => {
      next[table.id] = initialPosition(table);
    });
    setPositions(next);
    setDirty(false);
    setMessage("Se restauró la última distribución guardada.");
  }

  async function moveGuest(attendee: Attendee, tableId: string | null) {
    try {
      setMovingGuest(attendee.id);
      setMessage("");
      await assignTable(attendee.id, tableId);
      await source.reload();
      const target = tables.find((table) => table.id === tableId);
      setMessage(
        tableId
          ? `${attendee.full_name} fue movido a ${target?.name ?? "la mesa seleccionada"}.`
          : `${attendee.full_name} quedó sin mesa.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible mover al asistente.");
    } finally {
      setMovingGuest("");
    }
  }

  function guestDragStart(event: DragEvent<HTMLDivElement>, attendee: Attendee) {
    event.dataTransfer.setData("text/plain", attendee.id);
    event.dataTransfer.effectAllowed = "move";
  }

  async function dropGuest(event: DragEvent<HTMLButtonElement>, table: GalaTable) {
    event.preventDefault();
    const attendeeId = event.dataTransfer.getData("text/plain");
    const attendee = attendees.find((person) => person.id === attendeeId);
    if (!attendee || attendee.table_id === table.id) return;

    const occupied = attendees.filter((person) => person.table_id === table.id).length;
    if (occupied >= table.capacity) {
      setMessage(`${table.name} está completa.`);
      return;
    }

    await moveGuest(attendee, table.id);
    setSelected(table.id);
  }

  return (
    <AdminShell>
      <main className="adminPage floorPlanPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Versión 2.0</p>
            <h1>Plano interactivo del salón</h1>
            <p>
              Arrastra las mesas para representar el salón real. También puedes arrastrar
              asistentes entre mesas desde el panel lateral.
            </p>
          </div>

          <div className="tablePageActions">
            <button className="adminAction" onClick={source.reload}>
              <RefreshCw size={18} /> Actualizar
            </button>
            <button className="adminAction" disabled={!dirty} onClick={resetLocalLayout}>
              <RotateCcw size={18} /> Deshacer
            </button>
            <button className="adminAction primary" disabled={!dirty || saving} onClick={saveLayout}>
              <Save size={18} /> {saving ? "Guardando…" : "Guardar plano"}
            </button>
          </div>
        </section>

        <section className="summaryStrip floorPlanSummary">
          <div><span>Mesas</span><strong>{tables.length}</strong></div>
          <div><span>Confirmados</span><strong>{metrics.confirmed}</strong></div>
          <div><span>Asignados</span><strong>{metrics.assigned}</strong></div>
          <div><span>Acreditados</span><strong>{metrics.checked}</strong></div>
        </section>

        {message && <div className="operationMessage">{message}</div>}
        {source.error && <div className="dataError">{source.error}</div>}

        <section className="interactiveFloorWorkspace">
          <div className="interactiveFloor" ref={floorRef}>
            <div className="floorStage2">
              <span>ESCENARIO PRINCIPAL</span>
              <strong>II GRAN GALA NACIONAL 2026</strong>
            </div>

            <div className="floorEntrance2">
              <span>ACCESO</span>
            </div>

            {tables.map((table) => {
              const position = positions[table.id] ?? initialPosition(table);
              const guests = attendees.filter((attendee) => attendee.table_id === table.id);
              const checked = guests.filter((attendee) => attendee.checked_in).length;
              const full = guests.length >= table.capacity;
              const occupancy = table.capacity ? guests.length / table.capacity : 0;
              const state = full ? "full" : occupancy >= 0.7 ? "limited" : "available";

              return (
                <button
                  key={table.id}
                  className={`floorTable2 ${state} ${selected === table.id ? "selected" : ""}`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    borderColor: table.color ?? "#C8A14D",
                  }}
                  onPointerDown={(event) => beginMove(event, table)}
                  onPointerMove={(event) => moveTable(event, table)}
                  onPointerUp={endMove}
                  onPointerCancel={endMove}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropGuest(event, table)}
                  title="Arrastra para mover la mesa. Suelta aquí un asistente para cambiarlo de mesa."
                >
                  <Grip className="floorTableGrip" size={13} />
                  <span>Mesa {table.table_number}</span>
                  <strong>{table.name}</strong>
                  <small>{guests.length}/{table.capacity} · {checked} ingresados</small>
                </button>
              );
            })}

            <div className="floorLegend2">
              <span><i className="legendAvailable" /> Disponible</span>
              <span><i className="legendLimited" /> 70% o más</span>
              <span><i className="legendFull" /> Completa</span>
            </div>
          </div>

          <aside className="floorInspector2">
            <p className="panelEyebrow">Mesa seleccionada</p>
            <h2>{active?.name ?? "Sin mesa"}</h2>

            {active && (
              <>
                <div className="floorInspectorMeta">
                  <span>Mesa {active.table_number}</span>
                  <span>{active.zone}</span>
                  <span>{assigned.length}/{active.capacity} cupos</span>
                </div>

                <div className="floorGuestList">
                  {assigned.length === 0 && (
                    <div className="emptyTableMessage">
                      <UsersRound size={22} />
                      <span>Esta mesa todavía no tiene asistentes.</span>
                    </div>
                  )}

                  {assigned.map((attendee) => (
                    <div
                      className="floorGuestCard"
                      key={attendee.id}
                      draggable
                      onDragStart={(event) => guestDragStart(event, attendee)}
                    >
                      <span className="guestDragHandle"><Grip size={14} /></span>
                      <div>
                        <strong>{attendee.full_name}</strong>
                        <small>{attendee.circles?.name ?? "Sin círculo"}</small>
                      </div>

                      {attendee.checked_in && (
                        <CheckCircle2 className="guestChecked" size={18} />
                      )}

                      <select
                        aria-label={`Mover a ${attendee.full_name}`}
                        disabled={movingGuest === attendee.id}
                        value={attendee.table_id ?? ""}
                        onChange={(event) =>
                          moveGuest(attendee, event.target.value || null)
                        }
                      >
                        <option value="">Sin mesa</option>
                        {tables.map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.table_number}. {table.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="floorHelp2">
              <strong>Cómo usar el plano</strong>
              <p>1. Arrastra una mesa para cambiar su ubicación.</p>
              <p>2. Pulsa Guardar plano para conservar la distribución.</p>
              <p>3. En computador, arrastra un asistente y suéltalo sobre otra mesa.</p>
              <p>4. En teléfono o tablet, utiliza el selector del asistente para moverlo.</p>
            </div>
          </aside>
        </section>
      </main>
    </AdminShell>
  );
}
