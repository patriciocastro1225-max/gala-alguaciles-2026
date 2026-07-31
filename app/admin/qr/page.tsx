"use client";

import { useMemo, useState } from "react";
import { Mail, Printer, RefreshCw, Search } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendees, regenerateQr } from "@/services/attendees";

export default function QRPage() {
  const source=useAsyncData(listAttendees,[]);
  const [query,setQuery]=useState(""); const [selectedId,setSelectedId]=useState(""); const [message,setMessage]=useState("");
  const filtered=useMemo(()=>(source.data??[]).filter(g=>`${g.full_name} ${g.circles?.name??""} ${g.qr_code}`.toLowerCase().includes(query.toLowerCase())),[source.data,query]);
  const selected=(source.data??[]).find(g=>g.id===selectedId)??filtered[0];
  async function refresh(){if(!selected)return; try{await regenerateQr(selected.id);setMessage("QR regenerado correctamente.");await source.reload();}catch(e){setMessage(e instanceof Error?e.message:"No fue posible regenerar.");}}
  function email(){if(!selected?.email){setMessage("Este invitado no tiene correo registrado.");return;} window.location.href=`/admin/correos?attendee=${selected.id}`;}
  return <AdminShell><main className="adminPage">
   <section className="pageHeading"><div><p className="adminEyebrow">Credenciales verificables</p><h1>Códigos QR reales</h1><p>Cada QR contiene el token único almacenado en Supabase.</p></div></section>
   <section className="qrWorkspace"><article className="qrListPanel"><label className="searchBox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar asistente..."/></label><div className="qrGuestList">{filtered.map(g=><button key={g.id} className={selected?.id===g.id?"qrGuest active":"qrGuest"} onClick={()=>setSelectedId(g.id)}><span>{g.full_name.charAt(0)}</span><div><strong>{g.full_name}</strong><small>{g.circles?.name??"Sin círculo"} · {g.gala_tables?.name??"Sin mesa"}</small></div><i className={g.attendance_status==="Confirmado"?"statusConfirmed":"statusPending"}>{g.attendance_status}</i></button>)}</div></article>
   <article className="credentialCard">{selected?<><div className="credentialTop"><span>II</span><div><small>Credencial oficial</small><strong>Gran Gala Nacional 2026</strong></div></div><div className="realQr"><QRCodeSVG value={selected.qr_code} size={220} level="H" marginSize={3}/></div><h2>{selected.full_name}</h2><p>{selected.circles?.name??"Invitado institucional"}</p><dl><div><dt>Mesa</dt><dd>{selected.gala_tables?.name??"Sin asignar"}</dd></div><div><dt>Código</dt><dd>{selected.qr_code}</dd></div><div><dt>Estado</dt><dd>{selected.attendance_status}</dd></div></dl><div className="credentialActions"><button className="adminAction" onClick={refresh}><RefreshCw size={17}/> Regenerar</button><button className="adminAction" onClick={()=>window.print()}><Printer size={17}/> Imprimir</button><button className="adminAction primary" onClick={email}><Mail size={17}/> Enviar</button></div></>:<p>No hay asistentes.</p>}{message&&<p className="sendFeedback">{message}</p>}</article></section>
  </main></AdminShell>;
}
