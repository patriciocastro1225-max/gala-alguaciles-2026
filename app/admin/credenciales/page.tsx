"use client";
import { useMemo, useState } from "react";
import { Printer, Search } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import DigitalCredential from "@/components/admin/DigitalCredential";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendees } from "@/services/attendees";

export default function CredentialsPage(){
 const source=useAsyncData(listAttendees,[]); const [query,setQuery]=useState(""); const [selected,setSelected]=useState("");
 const rows=useMemo(()=>(source.data??[]).filter(a=>`${a.full_name} ${a.email??""} ${a.circles?.name??""}`.toLowerCase().includes(query.toLowerCase())),[source.data,query]);
 const current=rows.find(a=>a.id===selected)??rows[0];
 return <AdminShell><main className="adminPage credentialsPrintPage">
  <section className="pageHeading"><div><p className="adminEyebrow">Etiqueta térmica 100 × 50 mm</p><h1>Credenciales con QR</h1><p>Selecciona un asistente e imprime su etiqueta en tamaño real.</p></div><button className="adminAction primary" disabled={!current} onClick={()=>window.print()}><Printer size={18}/> Imprimir etiqueta</button></section>
  <section className="credentialWorkspace">
   <aside className="credentialDirectory"><label className="searchBox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar asistente..."/></label><div>{rows.map(a=><button key={a.id} className={current?.id===a.id?"active":""} onClick={()=>setSelected(a.id)}><strong>{a.full_name}</strong><small>{a.circles?.name??"Sin círculo"} · {a.gala_tables?.name??"Sin mesa"}</small></button>)}</div></aside>
   <div className="credentialPreview">{current?<DigitalCredential attendee={current}/>:<p className="emptyState">No hay asistentes disponibles.</p>}</div>
  </section>
 </main></AdminShell>;
}
