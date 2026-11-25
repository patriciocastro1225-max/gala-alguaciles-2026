"use client";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { requireSupabase } from "@/services/helpers";
type Guest = {id:string;table_id:string|null;full_name:string;attendance_status:string;seats_reserved:number|null;circles:{name:string}|null;gala_tables:{name:string;table_number:number}|null};
type Seat = {attendee_id:string;seat_number:number;guest_name:string;qr_code:string};
type Label = {tableId:string|null;name:string;qr:string;circle:string;table:string};
export default function PrintLetterLabels(){
 const [selectedTable,setSelectedTable]=useState("");
 const [tables,setTables]=useState<{id:string;name:string;number:number}[]>([]);
 const [issues,setIssues]=useState<{tableId:string|null;message:string}[]>([]);
 const [allLabels,setLabels]=useState<Label[]>([]);
 const [loading,setLoading]=useState(true);
 const [loadError,setError]=useState("");
 const [printSide,setPrintSide]=useState<"front"|"back">("front");
 const labels=selectedTable ? allLabels.filter(label=>label.tableId===selectedTable) : allLabels;
 const error=loadError || issues.find(issue=>!selectedTable || issue.tableId===selectedTable)?.message;
 useEffect(()=>{document.body.dataset.labelPrintSide=printSide;return()=>{delete document.body.dataset.labelPrintSide};},[printSide]);
 function printLabels(side:"front"|"back"){setPrintSide(side);setTimeout(()=>window.print(),100);}
 useEffect(()=>{let live=true;(async()=>{try{
  const client=requireSupabase();
  const [peopleResult,seatsResult]=await Promise.all([
   client.from("attendees").select("id,table_id,full_name,attendance_status,seats_reserved,circles(name),gala_tables(name,table_number)").order("full_name"),
   client.from("attendee_seats").select("attendee_id,seat_number,guest_name,qr_code").order("seat_number")
  ]);
  if(peopleResult.error)throw peopleResult.error;
  if(seatsResult.error)throw seatsResult.error;
  const people=(peopleResult.data??[]) as unknown as Guest[];
  const seats=(seatsResult.data??[]) as Seat[];
  const byPerson=new Map<string,Seat[]>();
  for(const seat of seats){const group=byPerson.get(seat.attendee_id)??[];group.push(seat);byPerson.set(seat.attendee_id,group);}
  const result:Label[]=[];
  const options=new Map<string,{id:string;name:string;number:number}>();
  const problems:{tableId:string|null;message:string}[]=[];
  for(const person of people){
   if(person.attendance_status==="Cancelado")continue;
   if(person.table_id && person.gala_tables)options.set(person.table_id,{id:person.table_id,name:person.gala_tables.name,number:person.gala_tables.table_number});
   const group=byPerson.get(person.id)??[];
   if(group.length===0){problems.push({tableId:person.table_id,message:"Faltan QR individuales para "+person.full_name+". Revise la sincronización antes de imprimir."});continue;}
   const expected=Math.max(1,Number(person.seats_reserved)||1);
   if(group.length!==expected){problems.push({tableId:person.table_id,message:"Cantidad de QR incorrecta para "+person.full_name+": "+group.length+" de "+expected+"."});continue;}
   for(const seat of group.sort((a,b)=>a.seat_number-b.seat_number)){
    result.push({tableId:person.table_id,name:seat.guest_name,qr:seat.qr_code,circle:person.circles?.name??"Invitado institucional",table:person.gala_tables?.name??"Mesa por asignar"});
   }
  }
  if(live){setLabels(result);setTables([...options.values()].sort((a,b)=>a.number-b.number));setIssues(problems);}
 }catch(e){if(live)setError(e instanceof Error?e.message:"No fue posible cargar las etiquetas.");}finally{if(live)setLoading(false);}})();return()=>{live=false};},[]);
 return <main className="adminPage letterLabelsPage">
  <section className="pageHeading letterLabelsToolbar"><div><a href="/admin/credenciales" className="adminAction">Volver a credenciales</a><p className="adminEyebrow">Impresión en papel carta</p><h1>Etiquetas para recortar</h1><p>8 etiquetas por hoja, de 9,2 × 6 cm. Incluye todos los cupos y nombres actualizados.</p></div><label>Mesa para imprimir <select value={selectedTable} onChange={e=>setSelectedTable(e.target.value)}><option value="">Todas las mesas</option>{tables.map(table=><option key={table.id} value={table.id}>Mesa {table.number} · {table.name}</option>)}</select></label><button className="adminAction primary" disabled={loading||!!error||labels.length===0} onClick={()=>printLabels("front")}><Printer size={18}/> Imprimir frentes ({labels.length})</button></section>
  {loading&&<p>Cargando etiquetas…</p>}{error&&<div className="dataError">{error}</div>}
  {!loading&&!error&&<><p className="letterLabelsToolbar">{labels.length} etiquetas · {Math.ceil(labels.length/8)} hojas tamaño carta. Imprima al 100%, sin ajustar a página y sin encabezados ni pies.</p><div className="letterSheets">{Array.from({length:Math.ceil(labels.length/8)},(_,page)=><section className="letterSheet" key={page}>{labels.slice(page*8,page*8+8).map(label=><article className="letterCutLabel" key={label.qr}><div className="letterLabelInfo"><div className="letterLabelBrand">II GRAN GALA NACIONAL 2026</div><strong>{label.name}</strong><span>{label.circle}</span><b>MESA: {label.table}</b><b>INSCRIPCIÓN: {label.qr.replace(/-(?:ACOMP|\\d{2})$/,"")}</b></div></article>)}</section>)}</div><div className="letterLabelsToolbar" style={{marginTop:20}}><p>Para el reverso, imprima estas hojas por separado y vuelva a introducir el papel según su impresora. Haga una prueba de alineación antes del lote completo.</p><button className="adminAction" onClick={()=>printLabels("back")}>Imprimir reversos</button></div><div className="letterSheets letterBackSheets">{Array.from({length:Math.ceil(labels.length/8)},(_,page)=><section className="letterSheet" key={page}>{labels.slice(page*8,page*8+8).map((label,i)=><article className="letterCutLabel letterBackLabel" key={label.qr}><div className="letterLabelInfo"><div className="letterLabelBrand">II GRAN GALA NACIONAL 2026</div><strong>“Donde hay un Carabinero siempre habrá un Alguacil y donde haya un Alguacil jamás un Carabinero estará solo”</strong></div></article>)}</section>)}</div></>}
 </main>;
}
