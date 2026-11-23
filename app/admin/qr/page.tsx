"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Printer, Search, UsersRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendees } from "@/services/attendees";
import { requireSupabase } from "@/services/helpers";

import * as XLSX from "xlsx";

type Seat={seat_number:number;guest_name:string;guest_type:string;qr_code:string;checked_in:boolean};

export default function QRPage(){
 const source=useAsyncData(listAttendees,[]);
 const [query,setQuery]=useState("");const [selectedId,setSelectedId]=useState("");const [seats,setSeats]=useState<Seat[]>([]);const [seatNumber,setSeatNumber]=useState(1);const [message,setMessage]=useState("");const [loadingSeats,setLoadingSeats]=useState(false);const [editingName,setEditingName]=useState(false);const [guestName,setGuestName]=useState("");const [savingName,setSavingName]=useState(false);
 const [importNames,setImportNames]=useState<string[]>([]);
 const [importError,setImportError]=useState("");
 const [importBusy,setImportBusy]=useState(false);
 const [importOwner,setImportOwner]=useState("");
 async function readNames(file:File|undefined){
  setImportNames([]);setImportError("");setImportOwner(selected?.id??"");
  if(!file)return;
  try{
   const workbook=XLSX.read(await file.arrayBuffer(),{type:"array"});
   const sheet=workbook.Sheets[workbook.SheetNames[0]];
   if(!sheet)throw new Error("El Excel no contiene hojas.");
   const rows=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,defval:"",blankrows:false});
   const names=rows.map(row=>String(row[0]??"").trim());
   if(names[0]&&["nombre","nombre completo","invitado","guest_name"].includes(names[0].toLowerCase()))names.shift();
   if(names.length!==seats.length)throw new Error(`El archivo tiene ${names.length} filas y esta inscripción tiene ${seats.length} QR. Deben coincidir exactamente, incluyendo el titular en la primera fila.`);
   if(names.some(n=>!n))throw new Error("Hay filas sin nombre. Complete todos los cupos antes de importar.");
   if(new Set(names.map(n=>n.toLocaleLowerCase("es-CL"))).size!==names.length)throw new Error("Hay nombres repetidos. Revise el Excel antes de continuar.");
   setImportNames(names);
  }catch(e){setImportError(e instanceof Error?e.message:"No fue posible leer el archivo.");}
 }
 async function importGuestNames(){
  if(!selected||importOwner!==selected.id||importNames.length!==seats.length||importBusy)return;
  if(!window.confirm(`¿Actualizar los nombres de los ${seats.length} QR de ${selected.full_name}? No se modificarán los códigos QR ni los pagos.`))return;
  setImportBusy(true);setImportError("");
  try{
   const client=requireSupabase();
   const {data:current,error:readError}=await client.from("attendee_seats").select("seat_number,qr_code,guest_name").eq("attendee_id",selected.id).order("seat_number");
   if(readError)throw readError;
   if(!current||current.length!==seats.length||current.some((r,i)=>r.seat_number!==seats[i].seat_number||r.qr_code!==seats[i].qr_code))throw new Error("Los QR cambiaron desde la vista previa. Recargue antes de importar.");
   let saved=0;
   for(let i=0;i<current.length;i++){
    if(current[i].guest_name===importNames[i])continue;
    const {data,error}=await client.from("attendee_seats").update({guest_name:importNames[i]}).eq("attendee_id",selected.id).eq("seat_number",current[i].seat_number).eq("qr_code",current[i].qr_code).select("seat_number");
    if(error||!data?.length)throw new Error(`No se pudo actualizar el cupo ${current[i].seat_number}. Se guardaron ${saved} cambios. Revise antes de repetir.`);
    saved++;
   }
   setSeats(prev=>prev.map((s,i)=>({...s,guest_name:importNames[i]})));
   setImportNames([]);setMessage(`Nombres actualizados: ${saved}. Los códigos QR permanecen iguales.`);
  }catch(e){setImportError(e instanceof Error?e.message:"Error al importar.");}
  finally{setImportBusy(false);}
 }
 const filtered=useMemo(()=>(source.data??[]).filter(g=>`${g.full_name} ${g.companion_name??""} ${g.circles?.name??""} ${g.qr_code}`.toLowerCase().includes(query.toLowerCase())),[source.data,query]);
 const selected=(source.data??[]).find(g=>g.id===selectedId)??filtered[0];
 useEffect(()=>{if(selected&&!selectedId)setSelectedId(selected.id);},[selected,selectedId]);
 useEffect(()=>{let live=true;async function load(){if(!selected){setSeats([]);return;}setLoadingSeats(true);setMessage("");try{const client=requireSupabase();const {data,error}=await client.rpc("get_attendee_seats",{p_attendee_id:selected.id});if(error)throw error;if(live){const rows=(data??[]) as Seat[];setSeats(rows);setSeatNumber(rows[0]?.seat_number??1);setEditingName(false);setImportNames([]);setImportOwner("");}}catch(e){if(live){setSeats([{seat_number:1,guest_name:selected.full_name,guest_type:"Titular",qr_code:selected.qr_code,checked_in:!!selected.checked_in}]);setSeatNumber(1);setMessage(e instanceof Error?e.message:"No fue posible cargar los accesos.");}}finally{if(live)setLoadingSeats(false);}}load();return()=>{live=false};},[selected?.id]);
 const seat=seats.find(s=>s.seat_number===seatNumber)??seats[0];
 async function saveGuestName(){
  if(!selected||!seat)return;
  const name=guestName.trim();
  if(!name){setMessage("Ingrese el nombre del invitado.");return;}
  setSavingName(true);setMessage("");
  try{
   const client=requireSupabase();
   const {data,error}=await client.from("attendee_seats").update({guest_name:name}).eq("attendee_id",selected.id).eq("seat_number",seat.seat_number).select("seat_number");
   if(error)throw error;
   if(!data?.length)throw new Error("No se pudo actualizar el cupo. Verifique los permisos.");
   setSeats(prev=>prev.map(s=>s.seat_number===seat.seat_number?{...s,guest_name:name}:s));
   setEditingName(false);setMessage("Nombre guardado correctamente. El QR individual se mantiene.");
  }catch(e){setMessage(e instanceof Error?e.message:"No fue posible guardar el nombre.");}
  finally{setSavingName(false);}
 }
 function email(){if(!selected?.email){setMessage("Este titular no tiene correo registrado.");return;}window.location.href=`/admin/correos?attendee=${selected.id}`;}
 return <AdminShell><main className="adminPage">
  <section className="pageHeading"><div><p className="adminEyebrow">Credenciales verificables</p><h1>Códigos QR reales</h1><p>Cada persona que ocupa un cupo tiene un QR individual almacenado en Supabase.</p></div></section>
  <section className="qrWorkspace"><article className="qrListPanel"><label className="searchBox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar titular o acompañante..."/></label><div className="qrGuestList">{filtered.map(g=>{const count=Number(g.seats_reserved??(g.companion_name?2:1));return <button key={g.id} className={selected?.id===g.id?"qrGuest active":"qrGuest"} onClick={()=>{setSelectedId(g.id);setSeatNumber(1)}}><span>{g.full_name.charAt(0)}</span><div><strong>{g.full_name}</strong><small>{g.circles?.name??"Sin círculo"} · {g.gala_tables?.name??"Sin mesa"}</small></div><i className="statusConfirmed">{count} {count===1?"QR":"QR"}</i></button>})}</div></article>
  <article className="credentialCard">{selected&&seat?<><div className="credentialTop"><span>II</span><div><small>Credencial oficial</small><strong>Gran Gala Nacional 2026</strong></div></div>{seats.length>1&&<div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",margin:"18px 0"}}>{seats.map(s=><button key={s.seat_number} className={s.seat_number===seat.seat_number?"adminAction primary":"adminAction"} onClick={()=>{setSeatNumber(s.seat_number);setEditingName(false);setMessage("");}}>{s.guest_type==="Titular"?"Titular":`Cupo ${s.seat_number}`}</button>)}</div>}<div className="realQr"><QRCodeSVG value={seat.qr_code} size={220} level="H" marginSize={3}/></div><h2>{seat.guest_name}</h2><p>{seat.guest_type} · {selected.circles?.name??"Invitado institucional"}</p><div className="qrEventDetails"><strong>MIÉRCOLES 25 DE NOVIEMBRE DE 2026 · 20:00 HORAS</strong><span>CLUB PALESTINO</span><span>Av. Presidente Kennedy N.º 9351, Las Condes, Santiago</span><strong>TENIDA: FORMAL SPORT</strong></div><dl><div><dt>Mesa</dt><dd>{selected.gala_tables?.name??"Sin asignar"}</dd></div><div><dt>Código QR</dt><dd>{seat.qr_code}</dd></div><div><dt>Ingreso</dt><dd>{seat.checked_in?"Registrado":"Pendiente"}</dd></div></dl><div className="credentialActions"><button className="adminAction" onClick={()=>window.print()}><Printer size={17}/> Imprimir</button><button className="adminAction primary" onClick={email}><Mail size={17}/> Enviar todos los QR</button></div>{selected&&seats.length>0&&<section style={{marginTop:22,padding:16,border:"1px solid #b89a5a",borderRadius:10}}>
 <h3>Recuperar nombres desde Excel</h3>
 <p>Seleccione un Excel (.xlsx, .xls) con una columna de nombres. Fila 1 = QR del cupo 1 (titular), fila 2 = QR del cupo 2, etc. Puede incluir encabezado «Nombre».</p>
 <input type="file" accept=".xlsx,.xls,.csv" disabled={importBusy} onChange={e=>{void readNames(e.target.files?.[0]);e.target.value="";}}/>
 {importNames.length>0&&importOwner===selected.id&&<><p><strong>Vista previa: {importNames.length} nombres para {seats.length} QR</strong></p><div style={{maxHeight:260,overflow:"auto"}}><table style={{width:"100%",fontSize:13}}><thead><tr><th>Cupo</th><th>Nombre actual</th><th>Nombre del Excel</th><th>QR (sin cambios)</th></tr></thead><tbody>{seats.map((s,i)=><tr key={s.seat_number}><td>{s.seat_number}</td><td>{s.guest_name}</td><td>{importNames[i]}</td><td>{s.qr_code}</td></tr>)}</tbody></table></div><button className="adminAction primary" disabled={importBusy} onClick={importGuestNames}>{importBusy?"Guardando...":"Confirmar nombres para estos QR"}</button></>}
 {importError&&<p role="alert" style={{color:"#b91c1c"}}>{importError}</p>}
 </section>}<div className="qrAdminEditControls" style={{marginTop:28,paddingTop:18,borderTop:"1px solid rgba(255,255,255,.25)"}}><p style={{textAlign:"center",fontSize:12,opacity:.75}}>ADMINISTRACIÓN · NO INCLUIR EN CREDENCIAL</p>{seat.seat_number>1&&<div style={{textAlign:"center",margin:"18px 0"}}>{editingName?<div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}><input aria-label="Nombre completo del invitado" value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="Nombre completo del invitado" style={{padding:10,minWidth:240}}/><button className="adminAction primary" disabled={savingName} onClick={saveGuestName}>{savingName?"Guardando...":"Guardar nombre"}</button><button className="adminAction" disabled={savingName} onClick={()=>setEditingName(false)}>Cancelar</button></div>:<button className="adminAction" onClick={()=>{setGuestName(seat.guest_name);setEditingName(true);}}>Editar nombre del cupo {seat.seat_number}</button>}</div>}</div>{seats.length>1&&<p style={{textAlign:"center",marginTop:14}}><UsersRound size={16} style={{verticalAlign:"middle",marginRight:6}}/>{seats.length} accesos individuales asociados a esta inscripción.</p>}</>:<p>{loadingSeats?"Cargando accesos...":"No hay asistentes."}</p>}{message&&<p className="sendFeedback">{message}</p>}</article></section>
 </main></AdminShell>;
}
