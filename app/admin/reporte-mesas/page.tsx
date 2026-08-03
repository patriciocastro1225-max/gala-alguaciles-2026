"use client";

import { Printer, RefreshCw, TableProperties, UsersRound } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listTableAttendees, listTables } from "@/services/tables";

async function load() {
  const [tables, attendees] = await Promise.all([listTables(), listTableAttendees()]);
  return { tables, attendees };
}

export default function TableReportPage() {
  const source = useAsyncData(load, []);
  const tables = source.data?.tables ?? [];
  const attendees = source.data?.attendees ?? [];

  return (
    <AdminShell>
      <main className="adminPage tableReportPage22">
        <section className="pageHeading noPrint22">
          <div>
            <p className="adminEyebrow">Distribución definitiva</p>
            <h1>Listado por mesa</h1>
            <p>Nómina imprimible de invitados para respaldo físico durante la Gala.</p>
          </div>
          <div className="tablePageActions">
            <button className="adminAction" onClick={source.reload}><RefreshCw size={17}/> Actualizar</button>
            <button className="adminAction primary" onClick={() => window.print()}><Printer size={17}/> Imprimir</button>
          </div>
        </section>

        <section className="tableReportSheets22">
          {tables.map((table) => {
            const guests = attendees.filter((a) => a.table_id === table.id);
            return (
              <article className="tableSheet22" key={table.id}>
                <header>
                  <div>
                    <span>Mesa {table.table_number}</span>
                    <h2>{table.name}</h2>
                  </div>
                  <strong>{guests.length}/{table.capacity}</strong>
                </header>

                <div className="tableSheetMeta22">
                  <span><TableProperties size={14}/>{table.zone}</span>
                  <span><UsersRound size={14}/>{guests.length} invitados</span>
                </div>

                <ol>
                  {guests.map((guest) => (
                    <li key={guest.id}>
                      <span>
                        <strong>{guest.full_name}</strong>
                        <small>{guest.circles?.name ?? "Sin círculo"}</small>
                      </span>
                      <span>{guest.checked_in ? "✓ Ingresó" : "Pendiente"}</span>
                    </li>
                  ))}
                  {guests.length === 0 && <li className="emptyReport22">Sin invitados asignados</li>}
                </ol>
              </article>
            );
          })}
        </section>
      </main>
    </AdminShell>
  );
}
