"use client";
import { useMemo, useState } from "react";
import { RefreshCw, Search, UserRoundCheck } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { assignTable, listTableAttendees, listTables } from "@/services/tables";
import type { Attendee, GalaTable } from "@/types/database";

async function load(){ const [tables,attendees]=await Promise.all([listTables(),listTableAttendees()]); return {tables,attendees}; }
export default function TablesPage(){
 const source=useAsyncData(load,[]); const [selected,setSelected]=useState(""); const [query,setQuery]=useState(""); const [busy,setBusy]=useState(""); const [message,setMessage]=useState("");
 const tables=source.data?.tables??[]; const attendees=source.data?.attendees??[]; const active=tables.find(t=>t.id===selected)??tables[0];
 const assigned=useMemo(()=>attendees.filter(a=>a.table_id===active?.id),[attendees,active]);
 const unassigned=useMemo(()=>attendees.filter(a=>!a.table_id&&a.full_name.toLowerCase().includes(query.toLowerCase())),[attendees,query]);
 async function move(a:Attendee,table:GalaTable|null){try{setBusy(a.id);setMessage("");await assignTable(a.id,table?.id??null);await source.reload();setMessage(table?`${a.full_name} fue asignado a ${table.name}.`:`${a.full_name} quedó sin mesa.`)}catch(e){setMessage(e instanceof Error?e.message:"No fue posible actualizar.")}finally{setBusy("")}}
 const totals={capacity:tables.reduce((s,t)=>s+t.capacity,0),occupied:attendees.filter(a=>a.table_id).length};
 return <AdminShell><main className="adminPage">
  <section className="pageHeading"><div><p className="adminEyebrow">Plano conectado a Supabase</p><h1>Salón y mesas</h1><p>Asignación real de asistentes, cupos y zonas del Club Palestino.</p></div><button className="adminAction" onClick={source.reload}><RefreshCw size={18}/> Actualizar</button></section>
  <section className="summaryStrip tableSummary"><div><span>Mesas</span><strong>{tables.length}</strong></div><div><span>Capacidad</span><strong>{totals.capacity}</strong></div><div><span>Asignados</span><strong>{totals.occupied}</strong></div><div><span>Disponibles</span><strong>{Math.max(0,totals.capacity-totals.occupied)}</strong></div></section>
  {message&&<div className="operationMessage">{message}</div>}{source.error&&<div className="dataError">{source.error}</div>}
  <section className="liveFloorWorkspace"><div className="liveFloor"><div className="stage"><span>ESCENARIO PRINCIPAL</span><strong>II GRAN GALA NACIONAL 2026</strong></div><div className="liveTableGrid">{tables.map(t=>{const count=attendees.filter(a=>a.table_id===t.id).length;const pct=Math.min(100,count/t.capacity*100);return <button key={t.id} className={`${active?.id===t.id?"active ":""}${count>=t.capacity?"full":pct>=70?"limited":""}`} onClick={()=>setSelected(t.id)}><span>Mesa {t.table_number}</span><strong>{t.name}</strong><small>{count} / {t.capacity}</small><i><b style={{width:`${pct}%`}}/></i></button>})}</div><div className="floorFooter"><span>Acceso principal</span><span>Recepción y acreditación</span></div></div>
   <aside className="tableInspector"><p className="panelEyebrow">Mesa seleccionada</p><h2>{active?.name??"Sin mesas"}</h2><p>{active?.zone} · {assigned.length}/{active?.capacity??0} cupos</p><div className="assignedGuests">{assigned.map(a=><div key={a.id}><span><strong>{a.full_name}</strong><small>{a.circles?.name??"Sin círculo"}</small></span><button disabled={busy===a.id} onClick={()=>move(a,null)}>Retirar</button></div>)}</div><hr/><label className="searchBox compact"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar sin mesa..."/></label><div className="unassignedGuests">{unassigned.slice(0,12).map(a=><button key={a.id} disabled={!active||assigned.length>=(active.capacity)||busy===a.id} onClick={()=>active&&move(a,active)}><UserRoundCheck size={16}/><span>{a.full_name}<small>{a.circles?.name??"Sin círculo"}</small></span></button>)}</div></aside>
  </section>
 </main></AdminShell>;
}
