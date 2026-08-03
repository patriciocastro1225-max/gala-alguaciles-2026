"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Search,
  UserCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { checkInByCode } from "@/services/attendees";
import {
  checkInCompanion,
  createIncident,
  listIncidents,
  resolveIncident,
  saveAccessNote,
  searchEventAttendees,
} from "@/services/eventDay";
import type { Attendee } from "@/types/database";

async function loadIncidents() {
  return listIncidents();
}

export default function EventOperationPage() {
  const incidents = useAsyncData(loadIncidents, []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Attendee[]>([]);
  const [selected, setSelected] = useState<Attendee | null>(null);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [incidentType, setIncidentType] = useState("Acceso");
  const [incidentDescription, setIncidentDescription] = useState("");

  const openIncidents = useMemo(
    () => (incidents.data ?? []).filter((incident) => !incident.resolved),
    [incidents.data]
  );

  async function runSearch() {
    setSearching(true);
    setMessage("");
    try {
      const rows = await searchEventAttendees(query);
      setResults(rows);
      if (rows.length === 1) {
        setSelected(rows[0]);
        setNote(rows[0].access_notes ?? "");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible buscar.");
    } finally {
      setSearching(false);
    }
  }

  function choose(attendee: Attendee) {
    setSelected(attendee);
    setNote(attendee.access_notes ?? "");
    setMessage("");
  }

  async function mainCheckIn() {
    if (!selected) return;
    setBusy("main");
    setMessage("");
    try {
      const updated = await checkInByCode(selected.qr_code);
      setSelected(updated);
      setResults((rows) =>
        rows.map((row) => (row.id === updated.id ? updated : row))
      );
      setMessage(`${updated.full_name} fue acreditado correctamente.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible acreditar.");
    } finally {
      setBusy("");
    }
  }

  async function companionCheckIn() {
    if (!selected) return;
    setBusy("companion");
    setMessage("");
    try {
      const response = await checkInCompanion(selected.id);
      const updated = {
        ...selected,
        companion_checked_in: response.companion_checked_in,
        companion_checkin_at: response.companion_checkin_at,
      };
      setSelected(updated);
      setResults((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
      setMessage(`Acompañante ${selected.companion_name} acreditado correctamente.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible acreditar al acompañante.");
    } finally {
      setBusy("");
    }
  }

  async function saveNote() {
    if (!selected) return;
    setBusy("note");
    try {
      await saveAccessNote(selected.id, note);
      setSelected({ ...selected, access_notes: note });
      setMessage("Observación de acceso guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar la observación.");
    } finally {
      setBusy("");
    }
  }

  async function addIncident() {
    if (!incidentDescription.trim()) return;
    setBusy("incident");
    try {
      await createIncident({
        attendee_id: selected?.id ?? null,
        incident_type: incidentType,
        description: incidentDescription.trim(),
      });
      setIncidentDescription("");
      await incidents.reload();
      setMessage("Incidencia registrada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible registrar la incidencia.");
    } finally {
      setBusy("");
    }
  }

  async function closeIncident(id: string) {
    await resolveIncident(id);
    await incidents.reload();
  }

  return (
    <AdminShell>
      <main className="adminPage eventOps24">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Versión 2.4</p>
            <h1>Operación Día del Evento</h1>
            <p>Búsqueda de emergencia, acreditación manual, acompañantes e incidencias de acceso.</p>
          </div>
        </section>

        <section className="eventOpsSearch24">
          <label className="searchBox">
            <Search size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && runSearch()}
              placeholder="Nombre, correo, teléfono o código QR..."
              autoFocus
            />
          </label>
          <button className="adminAction primary" onClick={runSearch} disabled={searching}>
            {searching ? "Buscando…" : "Buscar invitado"}
          </button>
        </section>

        {message && <div className="operationMessage">{message}</div>}

        <section className="eventOpsGrid24">
          <article className="eventResults24">
            <div className="panelTitle24">
              <div>
                <p className="panelEyebrow">Resultados</p>
                <h2>Invitados encontrados</h2>
              </div>
              <strong>{results.length}</strong>
            </div>

            <div className="eventResultList24">
              {results.map((attendee) => (
                <button
                  key={attendee.id}
                  className={selected?.id === attendee.id ? "active" : ""}
                  onClick={() => choose(attendee)}
                >
                  <span>
                    <strong>{attendee.full_name}</strong>
                    <small>{attendee.circles?.name ?? "Sin círculo"} · {attendee.gala_tables?.name ?? "Sin mesa"}</small>
                  </span>
                  <span className={attendee.checked_in ? "checked24" : "pending24"}>
                    {attendee.checked_in ? "Ingresó" : "Pendiente"}
                  </span>
                </button>
              ))}

              {!results.length && (
                <div className="emptyEvent24">
                  <Search size={26} />
                  <span>Realiza una búsqueda para comenzar.</span>
                </div>
              )}
            </div>
          </article>

          <article className="eventGuestCard24">
            {!selected ? (
              <div className="emptyEvent24 large24">
                <UserCheck size={34} />
                <span>Selecciona un invitado.</span>
              </div>
            ) : (
              <>
                <div className="eventGuestHeading24">
                  <div>
                    <p className="panelEyebrow">Ficha de acceso</p>
                    <h2>{selected.full_name}</h2>
                    <p>{selected.circles?.name ?? "Sin círculo"} · {selected.gala_tables?.name ?? "Sin mesa"}</p>
                  </div>
                  {selected.checked_in ? <CheckCircle2 className="bigOk24" /> : <CircleAlert className="bigPending24" />}
                </div>

                <div className="eventGuestStatus24">
                  <div>
                    <span>Asistencia</span>
                    <strong>{selected.attendance_status}</strong>
                  </div>
                  <div>
                    <span>Pago</span>
                    <strong>{selected.payment_status}</strong>
                  </div>
                  <div>
                    <span>QR</span>
                    <strong>{selected.qr_code}</strong>
                  </div>
                  <div>
                    <span>Ingreso</span>
                    <strong>{selected.checked_in ? "Acreditado" : "Pendiente"}</strong>
                  </div>
                </div>

                <div className="eventGuestActions24">
                  <button
                    className="eventCheckButton24"
                    disabled={selected.checked_in || busy === "main"}
                    onClick={mainCheckIn}
                  >
                    <UserRoundCheck />
                    <span>
                      <strong>{selected.checked_in ? "Invitado ya acreditado" : "Registrar ingreso"}</strong>
                      <small>{selected.checked_in ? selected.checkin_at ?? "" : "Acreditación manual de respaldo"}</small>
                    </span>
                  </button>

                  {selected.companion_name && (
                    <button
                      className="eventCheckButton24 companion24"
                      disabled={selected.companion_checked_in || busy === "companion"}
                      onClick={companionCheckIn}
                    >
                      <UsersRound />
                      <span>
                        <strong>{selected.companion_name}</strong>
                        <small>{selected.companion_checked_in ? "Acompañante ya ingresó" : "Registrar acompañante"}</small>
                      </span>
                    </button>
                  )}
                </div>

                <label className="accessNote24">
                  Observación de acceso
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ej.: Autorizar estacionamiento, requerimiento especial..."
                  />
                  <button className="adminAction" disabled={busy === "note"} onClick={saveNote}>
                    Guardar observación
                  </button>
                </label>
              </>
            )}
          </article>

          <aside className="incidentPanel24">
            <div>
              <p className="panelEyebrow">Incidencias</p>
              <h2>Control operativo</h2>
              <p>{openIncidents.length} abierta(s)</p>
            </div>

            <div className="newIncident24">
              <select value={incidentType} onChange={(event) => setIncidentType(event.target.value)}>
                <option>Acceso</option>
                <option>QR</option>
                <option>Mesa</option>
                <option>Pago</option>
                <option>Protocolo</option>
                <option>Otro</option>
              </select>
              <textarea
                rows={3}
                value={incidentDescription}
                onChange={(event) => setIncidentDescription(event.target.value)}
                placeholder="Describir incidencia..."
              />
              <button className="adminAction primary" disabled={busy === "incident"} onClick={addIncident}>
                <AlertTriangle size={16} /> Registrar
              </button>
            </div>

            <div className="incidentList24">
              {openIncidents.map((incident) => (
                <div key={incident.id}>
                  <span>
                    <strong>{incident.incident_type}</strong>
                    <small>{new Date(incident.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</small>
                  </span>
                  <p>{incident.description}</p>
                  <button onClick={() => closeIncident(incident.id)}>Resolver</button>
                </div>
              ))}

              {!openIncidents.length && (
                <div className="emptyEvent24">
                  <CheckCircle2 size={22} />
                  <span>Sin incidencias abiertas.</span>
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </AdminShell>
  );
}
