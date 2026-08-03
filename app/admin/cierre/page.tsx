"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  FileDown,
  Printer,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listTableAttendees, listTables } from "@/services/tables";
import { listPayments } from "@/services/payments";
import { listIncidents } from "@/services/eventDay";
import {
  createEventSnapshot,
  getFinalMetrics,
  listEventSnapshots,
} from "@/services/eventClosure";

const money = (value:number) =>
  new Intl.NumberFormat("es-CL",{
    style:"currency",
    currency:"CLP",
    maximumFractionDigits:0
  }).format(value);

async function load() {
  const [metrics, snapshots, tables, attendees, payments, incidents] = await Promise.all([
    getFinalMetrics(),
    listEventSnapshots(),
    listTables(),
    listTableAttendees(),
    listPayments(),
    listIncidents(),
  ]);
  return { metrics, snapshots, tables, attendees, payments, incidents };
}

function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replaceAll('"','""')}"`).join(";")
    )
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ClosurePage() {
  const source = useAsyncData(load, []);
  const [snapshotName, setSnapshotName] = useState("Cierre Oficial Gala 2026");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const metrics = source.data?.metrics;
  const attendees = source.data?.attendees ?? [];
  const tables = source.data?.tables ?? [];
  const payments = source.data?.payments ?? [];
  const incidents = source.data?.incidents ?? [];
  const snapshots = source.data?.snapshots ?? [];

  const attendancePct = metrics?.confirmados
    ? Math.round((metrics.acreditados / metrics.confirmados) * 100)
    : 0;

  const tableSummary = useMemo(
    () =>
      tables.map((table) => {
        const guests = attendees.filter((attendee) => attendee.table_id === table.id);
        return {
          table,
          assigned: guests.length,
          checked: guests.filter((guest) => guest.checked_in).length,
        };
      }),
    [tables, attendees]
  );

  async function createSnapshot() {
    if (!snapshotName.trim()) return;
    setCreating(true);
    setMessage("");
    try {
      await createEventSnapshot(snapshotName.trim(), "Cierre");
      await source.reload();
      setMessage("Cierre guardado correctamente. La fotografía estadística quedó archivada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar el cierre.");
    } finally {
      setCreating(false);
    }
  }

  function exportAttendees() {
    downloadCsv("asistencia-final-gala-2026.csv", [
      ["Invitado","Círculo","Mesa","Confirmación","Pago","Check-in","Hora ingreso","Acompañante","Ingreso acompañante"],
      ...attendees.map((a) => [
        a.full_name,
        a.circles?.name ?? "Sin círculo",
        a.gala_tables?.name ?? "Sin mesa",
        a.attendance_status,
        a.payment_status,
        a.checked_in ? "Sí" : "No",
        a.checkin_at ?? "",
        a.companion_name ?? "",
        a.companion_checked_in ? "Sí" : "No",
      ]),
    ]);
  }

  function exportTables() {
    downloadCsv("distribucion-final-mesas-gala-2026.csv", [
      ["Mesa","Nombre","Capacidad","Asignados","Acreditados","Disponibles"],
      ...tableSummary.map(({table,assigned,checked}) => [
        table.table_number,
        table.name,
        table.capacity,
        assigned,
        checked,
        Math.max(table.capacity - assigned,0),
      ]),
    ]);
  }

  function exportPayments() {
    downloadCsv("pagos-finales-gala-2026.csv", [
      ["Invitado","Círculo","Monto","Método","Estado","Fecha","Referencia"],
      ...payments.map((p) => [
        p.attendees?.full_name ?? "",
        p.attendees?.circles?.name ?? "",
        p.amount,
        p.method,
        p.status,
        p.payment_date ?? "",
        p.reference ?? "",
      ]),
    ]);
  }

  function exportIncidents() {
    downloadCsv("incidencias-gala-2026.csv", [
      ["Tipo","Descripción","Estado","Fecha"],
      ...incidents.map((i) => [
        i.incident_type,
        i.description,
        i.resolved ? "Resuelta" : "Abierta",
        i.created_at,
      ]),
    ]);
  }

  return (
    <AdminShell>
      <main className="adminPage closurePage25">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Versión 2.5</p>
            <h1>Reportes finales y cierre de la Gala</h1>
            <p>Consolida asistencia, mesas, finanzas e incidencias y guarda una fotografía histórica del evento.</p>
          </div>
          <div className="tablePageActions">
            <button className="adminAction" onClick={source.reload}>
              <RefreshCw size={17}/> Actualizar
            </button>
            <button className="adminAction primary" onClick={() => window.print()}>
              <Printer size={17}/> Imprimir informe final
            </button>
          </div>
        </section>

        {message && <div className="operationMessage">{message}</div>}
        {source.error && <div className="dataError">{source.error}</div>}

        <section className="closureHero25">
          <article><UsersRound/><span>Confirmados</span><strong>{metrics?.confirmados ?? 0}</strong></article>
          <article><CheckCircle2/><span>Acreditados</span><strong>{metrics?.acreditados ?? 0}</strong></article>
          <article><CheckCircle2/><span>Asistencia</span><strong>{attendancePct}%</strong></article>
          <article><Archive/><span>Recaudado</span><strong>{money(metrics?.recaudado ?? 0)}</strong></article>
        </section>

        <section className="closureSecondary25">
          <div><span>Acompañantes ingresados</span><strong>{metrics?.acompanantes_acreditados ?? 0} / {metrics?.acompanantes_registrados ?? 0}</strong></div>
          <div><span>Mesas</span><strong>{metrics?.mesas ?? 0}</strong></div>
          <div><span>Capacidad total</span><strong>{metrics?.capacidad_total ?? 0}</strong></div>
          <div><span>Incidencias abiertas</span><strong>{metrics?.incidencias_abiertas ?? 0}</strong></div>
        </section>

        <section className="closureGrid25">
          <article className="closurePanel25">
            <p className="panelEyebrow">Respaldo histórico</p>
            <h2>Guardar cierre oficial</h2>
            <p>
              Esta función guarda en Supabase una fotografía de los principales indicadores
              tal como están en este momento.
            </p>

            <label className="snapshotField25">
              Nombre del cierre
              <input
                value={snapshotName}
                onChange={(event) => setSnapshotName(event.target.value)}
              />
            </label>

            <button
              className="adminAction primary"
              disabled={creating || !snapshotName.trim()}
              onClick={createSnapshot}
            >
              <Archive size={17}/>
              {creating ? "Guardando cierre…" : "Guardar cierre oficial"}
            </button>

            <div className="snapshotList25">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id}>
                  <span>
                    <strong>{snapshot.snapshot_name}</strong>
                    <small>{snapshot.snapshot_type}</small>
                  </span>
                  <small>
                    {new Date(snapshot.created_at).toLocaleString("es-CL")}
                  </small>
                </div>
              ))}
              {!snapshots.length && <p>Aún no hay cierres archivados.</p>}
            </div>
          </article>

          <article className="closurePanel25">
            <p className="panelEyebrow">Descargas</p>
            <h2>Exportar información final</h2>

            <div className="closureExports25">
              <button onClick={exportAttendees}>
                <Download/>
                <span><strong>Asistencia final</strong><small>Invitados, mesa y check-in</small></span>
              </button>
              <button onClick={exportTables}>
                <FileDown/>
                <span><strong>Distribución de mesas</strong><small>Capacidad, asignados y acreditados</small></span>
              </button>
              <button onClick={exportPayments}>
                <Download/>
                <span><strong>Pagos finales</strong><small>Movimientos registrados</small></span>
              </button>
              <button onClick={exportIncidents}>
                <Download/>
                <span><strong>Incidencias</strong><small>Abiertas y resueltas</small></span>
              </button>
            </div>
          </article>
        </section>

        <section className="finalReport25">
          <header>
            <p>II Gran Gala Nacional de los Alguaciles de Chile 2026</p>
            <h2>Informe Final del Evento</h2>
          </header>

          <div className="finalReportMetrics25">
            <div><span>Registrados</span><strong>{metrics?.total_registrados ?? 0}</strong></div>
            <div><span>Confirmados</span><strong>{metrics?.confirmados ?? 0}</strong></div>
            <div><span>Acreditados</span><strong>{metrics?.acreditados ?? 0}</strong></div>
            <div><span>Asistencia</span><strong>{attendancePct}%</strong></div>
            <div><span>Recaudación</span><strong>{money(metrics?.recaudado ?? 0)}</strong></div>
            <div><span>Incidencias</span><strong>{metrics?.incidencias_totales ?? 0}</strong></div>
          </div>

          <h3>Resultado por mesa</h3>
          <table className="finalTable25">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Nombre</th>
                <th>Capacidad</th>
                <th>Asignados</th>
                <th>Acreditados</th>
                <th>Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {tableSummary.map(({table,assigned,checked}) => (
                <tr key={table.id}>
                  <td>{table.table_number}</td>
                  <td>{table.name}</td>
                  <td>{table.capacity}</td>
                  <td>{assigned}</td>
                  <td>{checked}</td>
                  <td>{assigned ? Math.round((checked/assigned)*100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </AdminShell>
  );
}
