"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, LogIn, Search, UserCheck, UsersRound, XCircle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { checkInByCode, listAttendees, updateAttendee } from "@/services/attendees";
import type { Attendee } from "@/types/database";

export default function CheckinPage(){
  const source=useAsyncData(listAttendees,[]);
  const [code,setCode]=useState("");
  const [query,setQuery]=useState("");
  const [last,setLast]=useState<Attendee|null>(null);
  const [message,setMessage]=useState("");
  const rows=useMemo(()=>(source.data??[]).filter(r=>`${r.full_name} ${r.qr_code}`.toLowerCase().includes(query.toLowerCase())),[source.data,query]);
  const checked=(source.data??[]).filter(r=>r.checked_in).length;

  async function registerCode(){
    try{const result=await checkInByCode(code);setLast(result);setMessage("Ingreso autorizado.");setCode("");await source.reload();}
    catch(e){setLast(null);setMessage(e instanceof Error?e.message:"No fue posible registrar.");}
  }
  async function manual(row:Attendee){
    try{const result=await updateAttendee(row.id,{checked_in:true,checkin_at:new Date().toISOString()});setLast(result);setMessage("Ingreso autorizado.");await source.reload();}
    catch(e){setMessage(e instanceof Error?e.message:"No fue posible registrar.");}
  }

  return <AdminShell><main className="adminPage">
    <section className="pageHeading"><div><p className="adminEyebrow">Operación en vivo</p><h1>Check-in real</h1><p>Cada ingreso se registra inmediatamente en Supabase.</p></div></section>
    <section className="checkinStats"><div><UsersRound/><span>Inscritos</span><strong>{(source.data??[]).length}</strong></div><div><UserCheck/><span>Ingresaron</span><strong>{checked}</strong></div><div><UserCheck/><span>Pendientes</span><strong>{(source.data??[]).length-checked}</strong></div><div><CheckCircle2/><span>Sincronización</span><strong>Activa</strong></div></section>
    <section className="checkinWorkspace">
      <article className="scannerPanel"><div className="scannerVisual"><LogIn size={80}/><strong>Validar credencial</strong><p>Ingrese el código QR impreso o leído por cámara.</p></div>
        <div className="manualCode"><label>Código QR<input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&registerCode()} placeholder="Código único"/></label><button className="adminAction primary" onClick={registerCode}><LogIn size={18}/> Registrar ingreso</button></div>
      </article>
      <aside className="checkinResult"><p className="panelEyebrow">Resultado</p>{message&&<div className={last?"entryResult success":"entryResult warning"}>{last?<CheckCircle2/>:<XCircle/>}<span>{message}</span><h2>{last?.full_name??"Sin registro"}</h2><p>{last?.circles?.name??""}</p><small>{last?.checkin_at?new Date(last.checkin_at).toLocaleString("es-CL"):""}</small></div>}</aside>
    </section>
    <section className="managementPanel checkinList"><div className="panelHeader"><h3>Listado operativo</h3><label className="searchBox compact"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar..."/></label></div>
      <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Asistente</th><th>Círculo</th><th>Mesa</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
        {rows.map(row=><tr key={row.id}><td><strong>{row.full_name}</strong><br/><small>{row.qr_code}</small></td><td>{row.circles?.name??"—"}</td><td>{row.gala_tables?.name??"Sin asignar"}</td><td><span className={row.checked_in?"statusConfirmed":"statusPending"}>{row.checked_in?"Ingresó":"Pendiente"}</span></td><td><button className="adminAction" disabled={row.checked_in} onClick={()=>manual(row)}>{row.checked_in?"Registrado":"Registrar"}</button></td></tr>)}
      </tbody></table></div>
    </section>
  </main></AdminShell>;
}
