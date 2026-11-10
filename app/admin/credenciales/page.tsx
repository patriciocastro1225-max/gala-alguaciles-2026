"use client";
import { useEffect, useMemo, useState } from "react";
import { Printer, Search } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import DigitalCredential from "@/components/admin/DigitalCredential";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendees } from "@/services/attendees";
import { requireSupabase } from "@/services/helpers";
type Seat = { seat_number:number; guest_name:string; qr_code:string };

export default function CredentialsPage(){
 const source=useAsyncData(listAttendees,[]); const [query,setQuery]=useState(""); const [selected,setSelected]=useState(""); const [seats,setSeats]=useState<Seat[]>([]); const [seatNumber,setSeatNumber]=useState(1); const [seatError,setSeatError]=useState("");
 const rows=useMemo(()=>(source.data??[]).filter(a=>`${a.full_name} ${a.email??""} ${a.circles?.name??""}`.toLowerCase().includes(query.toLowerCase())),[source.data,query]);
 const current=rows.find(a=>a.id===selected)??rows[0];
 useEffect(()=>{let live=true;async function load(){
  if(!current){setSeats([]);return;}
  setSeatError("");
  try{const client=requireSupabase();const {data,error}=await client.rpc("get_attendee_seats",{p_attendee_id:current.id});if(error)throw error;
   if(live){setSeats((data??[]) as Seat[]);setSeatNumber(1);}
  }catch(e){if(live){setSeats([]);setSeatError(e instanceof Error?e.message:"No fue posible cargar los cupos.");}}
 }void load();return()=>{live=false};},[current?.id]);
 const currentSeat=seats.find(s=>s.seat_number===seatNumber)??seats[0];
 return <AdminShell><main className="adminPage credentialsPrintPage">
  <section className="pageHeading"><div><p className="adminEyebrow">Etiqueta térmica 100 × 50 mm</p><h1>Credenciales con QR</h1><p>Selecciona un asistente e imprime su etiqueta en tamaño real.</p></div><a className="adminAction" href="/admin/credenciales/imprimir"><Printer size={18}/> Imprimir todas en carta</a><button className="adminAction primary" disabled={!current} onClick={()=>window.print()}><Printer size={18}/> Imprimir etiqueta</button></section>
  <section className="credentialWorkspace">
   <aside className="credentialDirectory"><label className="searchBox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar asistente..."/></label><div>{rows.map(a=><button key={a.id} className={current?.id===a.id?"active":""} onClick={()=>setSelected(a.id)}><strong>{a.full_name}</strong><small>{a.circles?.name??"Sin círculo"} · {a.gala_tables?.name??"Sin mesa"}</small></button>)}</div></aside>
   <div className="credentialPreview">{current?<><div className="credentialSeatPicker" style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{seats.map(s=><button key={s.seat_number} className={s.seat_number===currentSeat?.seat_number?"adminAction primary":"adminAction"} onClick={()=>setSeatNumber(s.seat_number)}>{s.seat_number===1?"Titular":`Cupo ${s.seat_number}`} · {s.guest_name}</button>)}</div>{seatError&&<p className="dataError">{seatError}</p>}<DigitalCredential attendee={current} guestName={currentSeat?.guest_name} qrCode={currentSeat?.qr_code}/></>:<p className="emptyState">No hay asistentes disponibles.</p>}</div>
  </section>
 </main></AdminShell>;
}
