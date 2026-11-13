"use client";

import { Printer, RefreshCw, TableProperties, UsersRound } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listTableAttendees, listTables } from "@/services/tables";
import { requireSupabase } from "@/services/helpers";
type Seat = { attendee_id:string; seat_number:number; guest_name:string; checked_in:boolean };
type ReportGuest = { id:string; name:string; circle:string; checked_in:boolean };

async function load() {
  const client = requireSupabase();
  const [tables, attendees, seatsResult] = await Promise.all([
    listTables(),
    listTableAttendees(),
    client.from("attendee_seats").select("attendee_id,seat_number,guest_name,checked_in").order("seat_number")
  ]);
  if(seatsResult.error) throw seatsResult.error;
  const seats=(seatsResult.data??[]) as Seat[];
  const byAttendee=new Map<string,Seat[]>();
  for(const seat of seats){const group=byAttendee.get(seat.attendee_id)??[];group.push(seat);byAttendee.set(seat.attendee_id,group);}
  return { tables, attendees, byAttendee };
}

export default function TableReportPage() {
  const source = useAsyncData(load, []);
  const tables = source.data?.tables ?? [];
  const attendees = source.data?.attendees ?? [];
  const byAttendee=source.data?.byAttendee ?? new Map<string,Seat[]>();

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

        {source.error&&<div className="dataError">{source.error}</div>}
        <section className="tableReportSheets22">
          {tables.map((table) => {
            const registrations = attendees.filter((a) => a.table_id === table.id);
            const guests:ReportGuest[] = registrations.flatMap(a=>{
              const seats=byAttendee.get(a.id)??[];
              if(seats.length)return seats.map(s=>({
                id:`${a.id}-${s.seat_number}`,name:s.guest_name,
                circle:a.circles?.name??"Sin círculo",checked_in:s.checked_in
              }));
              const count=Math.max(1,Number(a.seats_reserved)||1);
              return Array.from({length:count},(_,i)=>({
                id:`${a.id}-${i+1}`,
                name:i===0?a.full_name:i===1&&a.companion_name?a.companion_name:`Invitado ${i+1} de ${a.full_name}`,
                circle:a.circles?.name??"Sin círculo",
                checked_in:i===0?Boolean(a.checked_in):false
              }));
            });
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
                        <strong>{guest.name}</strong>
                        <small>{guest.circle}</small>
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
