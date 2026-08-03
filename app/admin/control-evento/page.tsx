"use client";

import { useEffect, useMemo } from "react";
import {
  CheckCircle2,
  CircleAlert,
  TableProperties,
  UserCheck,
  UsersRound,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listTableAttendees, listTables } from "@/services/tables";
import { listIncidents } from "@/services/eventDay";

async function load() {
  const [tables, attendees, incidents] = await Promise.all([
    listTables(),
    listTableAttendees(),
    listIncidents(),
  ]);
  return { tables, attendees, incidents };
}

export default function EventControlPage() {
  const source = useAsyncData(load, []);

  useEffect(() => {
    const timer = window.setInterval(() => source.reload(), 10000);
    return () => window.clearInterval(timer);
  }, [source]);

  const tables = source.data?.tables ?? [];
  const attendees = source.data?.attendees ?? [];
  const incidents = source.data?.incidents ?? [];

  const metrics = useMemo(() => {
    const active = attendees.filter((a) => a.attendance_status !== "Cancelado");
    const confirmed = active.filter((a) => a.attendance_status === "Confirmado").length;
    const checked = active.filter((a) => a.checked_in).length;
    const companionTotal = active.filter((a) => a.companion_name).length;
    const companionChecked = active.filter((a) => a.companion_checked_in).length;
    return {
      confirmed,
      checked,
      pending: Math.max(confirmed - checked, 0),
      companionTotal,
      companionChecked,
      openIncidents: incidents.filter((i) => !i.resolved).length,
      pct: confirmed ? Math.round((checked / confirmed) * 100) : 0,
    };
  }, [attendees, incidents]);

  return (
    <AdminShell>
      <main className="adminPage controlEvent24">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Centro de control</p>
            <h1>Estado en vivo de la Gala</h1>
            <p>Actualización automática cada 10 segundos.</p>
          </div>
        </section>

        <section className="controlHero24">
          <article><UserCheck /><span>Acreditados</span><strong>{metrics.checked}</strong></article>
          <article><UsersRound /><span>Pendientes</span><strong>{metrics.pending}</strong></article>
          <article><CheckCircle2 /><span>Asistencia</span><strong>{metrics.pct}%</strong></article>
          <article><CircleAlert /><span>Incidencias</span><strong>{metrics.openIncidents}</strong></article>
        </section>

        <section className="companionStrip24">
          <span>Acompañantes acreditados</span>
          <strong>{metrics.companionChecked} / {metrics.companionTotal}</strong>
        </section>

        <section className="controlTables24">
          {tables.map((table) => {
            const guests = attendees.filter((a) => a.table_id === table.id);
            const checked = guests.filter((a) => a.checked_in).length;
            return (
              <article key={table.id}>
                <header>
                  <span>Mesa {table.table_number}</span>
                  <strong>{table.name}</strong>
                </header>
                <div>
                  <TableProperties />
                  <span>{guests.length}/{table.capacity} asignados</span>
                  <strong>{checked} ingresados</strong>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </AdminShell>
  );
}
