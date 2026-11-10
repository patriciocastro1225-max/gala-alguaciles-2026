"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { requireSupabase } from "@/services/helpers";
type Guest = {id:string;full_name:string;attendance_status:string;seats_reserved:number|null;circles:{name:string}|null;gala_tables:{name:string}|null};
type Seat = {attendee_id:string;seat_number:number;guest_name:string;qr_code:string};
type Label = {name:string;qr:string;circle:string;table:string};
export default function PrintLetterLabels(){
 const [labels,setLabels]=useState<Label[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{let live=true;(async()=>{try{
  const client=requireSupabase();
  const [peopleResult,seatsResult]=await Promise.all([
   client.from("attendees").select("id,full_name,attendance_status,seats_reserved,circles(name),gala_tables(name)").order("full_name"),
   client.from("attendee_seats").select("attendee_id,seat_number,guest_name,qr_code").order("seat_number")
  ]);
  if(peopleResult.error)throw peopleResult.error;
  if(seatsResult.error)throw seatsResult.error;
  const people=(peopleResult.data??[]) as unknown as Guest[];
  const seats=(seatsResult.data??[]) as Seat[];
  const byPerson=new Map<string,Seat[]>();
  for(const seat of seats){const group=byPerson.get(seat.attendee_id)??[];group.push(seat);byPerson.set(seat.attendee_id,group);}
  const result:Label[]=[];
  for(const person of people){
   if(person.attendance_status==="Cancelado")continue;
   const group=byPerson.get(person.id)??[];
   if(group.length===0)throw new Error("Faltan QR individuales para "+person.full_name+". Revise la sincronización antes de imprimir.");
   const expected=Math.max(1,Number(person.seats_reserved)||1);
   if(group.length!==expected)throw new Error("Cantidad de QR incorrecta para "+person.full_name+": "+group.length+" de "+expected+".");
   for(const seat of group.sort((a,b)=>a.seat_number-b.seat_number)){
    result.push({name:seat.guest_name,qr:seat.qr_code,circle:person.circles?.name??"Invitado institucional",table:person.gala_tables?.name??"Mesa por asignar"});
   }
  }
  if(live)setLabels(result);
 }catch(e){if(live)setError(e instanceof Error?e.message:"No fue posible cargar las etiquetas.");}finally{if(live)setLoading(false);}})();return()=>{live=false};},[]);
 return <AdminShell><main className="adminPage letterLabelsPage">
  <section className="pageHeading letterLabelsToolbar"><div><p className="adminEyebrow">Impresión en papel carta</p><h1>Etiquetas para recortar</h1><p>8 etiquetas por hoja, de 9,4 × 6 cm. Incluye todos los cupos y nombres actualizados.</p></div><button className="adminAction primary" disabled={loading||!!error||labels.length===0} onClick={()=>window.print()}><Printer size={18}/> Imprimir todas ({labels.length})</button></section>
  {loading&&<p>Cargando todos los códigos QR…</p>}{error&&<div className="dataError">{error}</div>}
  {!loading&&!error&&<><p className="letterLabelsToolbar">{labels.length} etiquetas · {Math.ceil(labels.length/8)} hojas tamaño carta. Imprima al 100%, sin ajustar a página y sin encabezados ni pies.</p><div className="letterSheets">{Array.from({length:Math.ceil(labels.length/8)},(_,page)=><section className="letterSheet" key={page}>{labels.slice(page*8,page*8+8).map(label=><article className="letterCutLabel" key={label.qr}><div className="letterLabelInfo"><div className="letterLabelBrand">II GRAN GALA NACIONAL 2026</div><strong>{label.name}</strong><span>{label.circle}</span><b>MESA: {label.table}</b></div><div className="letterLabelQr"><QRCodeSVG value={label.qr} size={112} level="H" marginSize={1}/><small>{label.qr}</small></div></article>)}</section>)}</div></>}
 </main></AdminShell>;
}
