"use client";

import * as XLSX from "xlsx";
import { Download, Printer, RefreshCw, TableProperties, UsersRound } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listTableAttendees, listTables } from "@/services/tables";
import { requireSupabase } from "@/services/helpers";
type Seat = { attendee_id:string; seat_number:number; guest_name:string; checked_in:boolean };
type ReportGuest = { id:string; name:string; circle:string; checked_in:boolean };

async function load() {
  const client = requireSupabase();
  const [tables, attendees, seatsResult, invitationResult] = await Promise.all([
    listTables(),
    listTableAttendees(),
    client.from("attendee_seats").select("attendee_id,seat_number,guest_name,checked_in").order("seat_number"),
    client.from("payments").select("attendee_id").eq("method","Invitación")
  ]);
  if(seatsResult.error) throw seatsResult.error;
  const seats=(seatsResult.data??[]) as Seat[];
  const byAttendee=new Map<string,Seat[]>();
  for(const seat of seats){const group=byAttendee.get(seat.attendee_id)??[];group.push(seat);byAttendee.set(seat.attendee_id,group);}
  if(invitationResult.error) throw invitationResult.error;
  const invitationIds=new Set((invitationResult.data??[]).map(p=>p.attendee_id));
  return { tables, attendees, byAttendee, invitationIds };
}

export default function TableReportPage() {
  const source = useAsyncData(load, []);
  const tables = source.data?.tables ?? [];
  const attendees = source.data?.attendees ?? [];
  const byAttendee=source.data?.byAttendee ?? new Map<string,Seat[]>();
  const counts=new Map<string,number>();
  for(const a of attendees){if(!a.table_id)continue;const count=byAttendee.get(a.id)?.length||Math.max(1,Number(a.seats_reserved)||1);counts.set(a.table_id,(counts.get(a.table_id)??0)+count);}
  const orderedTables=[...tables].sort((a,b)=>(counts.get(b.id)??0)-(counts.get(a.id)??0)||Number(a.table_number)-Number(b.table_number));

  function exportGuests() {
    if (!source.data || source.error) return;
    const names=attendees.filter(a=>a.attendance_status!=="Cancelado" && (a.payment_status==="Invitación" || source.data?.invitationIds.has(a.id))).flatMap(a=>{
      const seats=byAttendee.get(a.id)??[];
      return seats.length ? seats.map(s=>s.guest_name) : Array.from({length:Math.max(1,Number(a.seats_reserved)||1)},(_,i)=>i===0?a.full_name:i===1&&a.companion_name?a.companion_name:`Invitado ${i+1} de ${a.full_name}`);
    }).sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"}));
    const rows=[["Nº","Nombre del invitado"],...names.map((name,i)=>[i+1,name])];
    const sheet=XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"]=[{wch:8},{wch:60}];
    sheet["!autofilter"]={ref:sheet["!ref"]??"A1:B1"};
    const book=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book,sheet,"Invitados");
    XLSX.writeFile(book,"gran-gala-solo-invitados.xlsx");
  }

  function printTableSigns() {
    if (!source.data || source.error) return;
    const win=window.open("","_blank");
    if(!win){window.alert("Permita las ventanas emergentes para imprimir los letreros.");return;}
    const escapeHtml=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const signs=[...tables].sort((a,b)=>Number(a.table_number)-Number(b.table_number));
    const pages=Array.from({length:Math.ceil(signs.length/2)},(_,i)=>{
      const pair=signs.slice(i*2,i*2+2);
      return '<section class="sheet">'+pair.map(t=>'<div class="sign"><div class="name" style="font-size:'+ (t.name.length>45?30:t.name.length>28?38:t.name.length>16?48:64)+'pt">'+escapeHtml(t.name)+'</div></div>').join("")+'</section>';
    }).join("");
    win.document.open();
    win.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Letreros de mesas</title><style>@page{size:letter portrait;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111}.sheet{width:215.9mm;height:279.4mm;break-after:page;page-break-after:always;overflow:hidden}.sheet:last-child{break-after:auto;page-break-after:auto}.sign{height:139.7mm;width:215.9mm;display:flex;align-items:center;justify-content:center;text-align:center;padding:12mm 10mm}.sign:first-child{border-bottom:1px dashed #aaa}.name{font-weight:800;line-height:1.08;overflow-wrap:anywhere;max-width:100%}@media screen{body{background:#ddd}.sheet{background:white;margin:12px auto}}</style></head><body>'+pages+'</body></html>');
    win.document.close();
    win.focus();
    win.print();
  }

  function exportExcel() {
    if (!source.data || source.error) return;
    const rows: (string | number)[][] = [["Mesa Nº", "Mesa", "Zona", "Cupo", "Capacidad", "Invitado", "Círculo", "Ingreso"]];
    for (const table of orderedTables) {
      let seatIndex = 0;
      for (const a of attendees.filter(a=>a.table_id===table.id)) {
        const seats=byAttendee.get(a.id)??[];
        const names=seats.length
          ? seats.map(s=>({name:s.guest_name,checked:s.checked_in}))
          : Array.from({length:Math.max(1,Number(a.seats_reserved)||1)},(_,i)=>({
              name:i===0?a.full_name:i===1&&a.companion_name?a.companion_name:`Invitado ${i+1} de ${a.full_name}`,
              checked:i===0?Boolean(a.checked_in):false
            }));
        for (const guest of names) {
          rows.push([table.table_number,table.name,table.zone,++seatIndex,table.capacity,guest.name,a.circles?.name??"Sin círculo",guest.checked?"Ingresó":"Pendiente"]);
        }
      }
      if (!seatIndex) rows.push([table.table_number,table.name,table.zone,"",table.capacity,"Sin invitados asignados","",""]);
    }
    const sheet=XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"]=[{wch:10},{wch:35},{wch:18},{wch:9},{wch:12},{wch:48},{wch:48},{wch:16}];
    sheet["!autofilter"]={ref:sheet["!ref"]??"A1:H1"};
    const book=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book,sheet,"Listado por mesas");
    XLSX.writeFile(book,"gran-gala-listado-por-mesas.xlsx");
  }

  return (
    <AdminShell>
      <main className="adminPage tableReportPage22">
        <section className="pageHeading noPrint22">
          <div>
            <p className="adminEyebrow">Distribución definitiva</p>
            <h1>Listado por mesa</h1>
            <p>Nómina imprimible de invitados, ordenada por cantidad de personas de mayor a menor.</p>
          </div>
          <div className="tablePageActions">
            <button className="adminAction" onClick={source.reload}><RefreshCw size={17}/> Actualizar</button>
            <button className="adminAction" disabled={!source.data || Boolean(source.error)} onClick={exportExcel}><Download size={17}/> Exportar a Excel</button>
            <button className="adminAction" disabled={!source.data || Boolean(source.error)} onClick={exportGuests}><Download size={17}/> Exportar invitaciones de cortesía</button>
            <button className="adminAction primary" disabled={!source.data || Boolean(source.error)} onClick={() => window.print()}><Printer size={17}/> Imprimir</button>
            <button className="adminAction primary" disabled={!source.data || Boolean(source.error)} onClick={printTableSigns}><Printer size={17}/> Imprimir letreros de mesas</button>
          </div>
        </section>

        {source.error&&<div className="dataError">{source.error}</div>}
        <section className="tableReportSheets22">
          {orderedTables.map((table) => {
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
