"use client";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, Search, ShieldAlert, UsersRound } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { checkInByCode, listAttendees, updateAttendee } from "@/services/attendees";
import type { Attendee } from "@/types/database";

export default function EventModePage(){
 const [rows,setRows]=useState<Attendee[]>([]),[query,setQuery]=useState(""),[code,setCode]=useState(""),[loading,setLoading]=useState(true),[notice,setNotice]=useState("");
 async function reload(){try{setLoading(true);setRows(await listAttendees())}catch(e){setNotice(e instanceof Error?e.message:"Error de conexión") }finally{setLoading(false)}}
 useEffect(()=>{reload();const timer=window.setInterval(reload,15000);return()=>window.clearInterval(timer)},[]);
 const filtered=useMemo(()=>rows.filter(a=>`${a.full_name} ${a.qr_code} ${a.circles?.name??""}`.toLowerCase().includes(query.toLowerCase())),[rows,query]);
 const entered=rows.filter(a=>a.checked_in).length, confirmed=rows.filter(a=>a.attendance_status==="Confirmado").length, pendingPayment=rows.filter(a=>a.payment_status==="Pendiente").length;
 async function register(a?:Attendee){try{const result=a?await updateAttendee(a.id,{checked_in:true,checkin_at:new Date().toISOString()}):await checkInByCode(code);setNotice(`Ingreso autorizado: ${result.full_name}`);setCode("");await reload()}catch(e){setNotice(e instanceof Error?e.message:"No fue posible registrar")}}
 return <AdminShell><main className="adminPage eventControlPage">
  <section className="eventControlHero"><div><p className="adminEyebrow">Modo día del evento</p><h1>Centro de acreditación</h1><p>Actualización automática cada 15 segundos.</p></div><div className="liveBadge"><i/> EN VIVO</div></section>
  <section className="eventKpis"><article><UsersRound/><span>Confirmados</span><strong>{confirmed}</strong></article><article><CheckCircle2/><span>Ingresaron</span><strong>{entered}</strong></article><article><Clock3/><span>Por llegar</span><strong>{Math.max(0,confirmed-entered)}</strong></article><article><ShieldAlert/><span>Pago pendiente</span><strong>{pendingPayment}</strong></article></section>
  <section className="fastCheckin"><label><span>Código de credencial</span><input autoFocus value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&register()} placeholder="Escanee o escriba el código QR"/></label><button onClick={()=>register()}>Autorizar ingreso</button><button className="refreshButton" onClick={reload}><RefreshCw size={19}/></button></section>
  {notice&&<div className="eventNotice">{notice}</div>}
  <section className="eventGuestList"><header><h2>Asistentes</h2><label className="searchBox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nombre, círculo o código..."/></label></header>{loading?<p className="dataLoading">Sincronizando…</p>:<div>{filtered.map(a=><article key={a.id} className={a.checked_in?"entered":""}><span className="guestInitial">{a.full_name.charAt(0)}</span><div><strong>{a.full_name}</strong><small>{a.circles?.name??"Sin círculo"} · {a.gala_tables?.name??"Sin mesa"}</small></div><span className={`paymentFlag ${a.payment_status.toLowerCase()}`}>{a.payment_status}</span><button disabled={a.checked_in} onClick={()=>register(a)}>{a.checked_in?"Acreditado":"Ingresar"}</button></article>)}</div>}</section>
 </main></AdminShell>;
}
