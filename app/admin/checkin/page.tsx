"use client";
import { useEffect,useMemo,useRef,useState } from "react";
import { Camera,CheckCircle2,LogIn,Search,UserCheck,UsersRound,XCircle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { checkInByCode,listAttendees } from "@/services/attendees";
import type { Attendee } from "@/types/database";
import { requireSupabase } from "@/services/helpers";


export default function CheckinPage(){
 const source=useAsyncData(listAttendees,[]); const [code,setCode]=useState(""); const [query,setQuery]=useState(""); const [last,setLast]=useState<Attendee|null>(null); const [message,setMessage]=useState(""); const [scanning,setScanning]=useState(false); const scannerRef=useRef<import("html5-qrcode").Html5Qrcode|null>(null); const scanningRef=useRef(false);
 const [seatStats,setSeatStats]=useState({total:0,checked:0});
 async function reloadSeats(){
  const client=requireSupabase();
  const {data,error}=await client.from("attendee_seats").select("attendee_id,checked_in");
  if(error){setMessage(error.message);return;}
  const activeIds=new Set((source.data??[]).filter(a=>a.attendance_status!=="Cancelado").map(a=>a.id));
  const seats=(data??[]).filter(s=>activeIds.has(s.attendee_id));
  setSeatStats({total:seats.length,checked:seats.filter(s=>s.checked_in).length});
 }
 useEffect(()=>{if(source.data)void reloadSeats();},[source.data]);
 const rows=useMemo(()=>(source.data??[]).filter(r=>`${r.full_name} ${r.qr_code}`.toLowerCase().includes(query.toLowerCase())),[source.data,query]);
 async function register(value=code){try{const result=await checkInByCode(value);setLast(result);setMessage("Ingreso autorizado.");setCode("");await source.reload();await reloadSeats();stopCamera();}catch(e){setLast(null);setMessage(e instanceof Error?e.message:"No fue posible registrar.");}}
 async function manual(row:Attendee){try{const result=await checkInByCode(row.qr_code);setLast(result);setMessage("Ingreso autorizado.");await source.reload();await reloadSeats();}catch(e){setMessage(e instanceof Error?e.message:"No fue posible registrar.");}}
 async function stopCamera(){
  scanningRef.current=false;
  const scanner=scannerRef.current;
  scannerRef.current=null;
  setScanning(false);
  if(scanner){try{if(scanner.isScanning)await scanner.stop();}catch{}try{scanner.clear();}catch{}}
 }
 async function startCamera(){
  if(scanningRef.current)return;
  if(!navigator.mediaDevices?.getUserMedia){setMessage("La cámara requiere HTTPS y permisos del navegador. Abra la página directamente en Safari o Chrome.");return;}
  scanningRef.current=true;setMessage("");
  try{
   const {Html5Qrcode}=await import("html5-qrcode");
   if(!scanningRef.current)return;
   const scanner=new Html5Qrcode("gala-qr-camera",{verbose:false});
   scannerRef.current=scanner;
   await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:230,height:230}},async decoded=>{
    if(!scanningRef.current)return;
    scanningRef.current=false;
    await stopCamera();
    await register(decoded);
   },()=>{});
   setScanning(true);
  }catch(e){
   await stopCamera();
   setMessage("No se pudo abrir la cámara. Compruebe que Safari o Chrome tenga permiso para usarla y que la página esté abierta con HTTPS.");
  }
 }
 useEffect(()=>()=>{void stopCamera();},[]);
 return <AdminShell><main className="adminPage"><section className="pageHeading"><div><p className="adminEyebrow">Operación en vivo</p><h1>Check-in con cámara</h1><p>Escanea el QR o ingresa el código impreso.</p></div></section><section className="checkinStats"><div><UsersRound/><span>Asistentes</span><strong>{seatStats.total}</strong></div><div><UserCheck/><span>Ingresaron</span><strong>{seatStats.checked}</strong></div><div><UserCheck/><span>Pendientes</span><strong>{seatStats.total-seatStats.checked}</strong></div><div><CheckCircle2/><span>Sincronización</span><strong>Activa</strong></div></section>
 <section className="checkinWorkspace"><article className="scannerPanel"><div className="scannerVisual"><><div id="gala-qr-camera" style={{width:"100%",maxWidth:380,margin:"0 auto"}}/>{!scanning&&<><Camera size={80}/><strong>Lector QR</strong><p>Usa la cámara trasera del teléfono o tablet.</p></>}</> </div><div className="scannerButtons"><button className="adminAction" onClick={()=>{if(scanning)void stopCamera();else void startCamera();}}><Camera size={18}/>{scanning?"Detener cámara":"Abrir cámara"}</button></div><div className="manualCode"><label>Código QR<input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&register()} placeholder="GALA2026-..."/></label><button className="adminAction primary" onClick={()=>register()}><LogIn size={18}/>Registrar ingreso</button></div></article><aside className="checkinResult"><p className="panelEyebrow">Resultado</p>{message&&<div className={last?"entryResult success":"entryResult warning"}>{last?<CheckCircle2/>:<XCircle/>}<span>{message}</span><h2>{last?.full_name??"Sin registro"}</h2><p>{last?.circles?.name??""}</p><p><strong>{last?.gala_tables?.name ? `Mesa: ${last.gala_tables.name}` : "Mesa sin asignar"}</strong></p><small>{last?.checkin_at?new Date(last.checkin_at).toLocaleString("es-CL"):""}</small></div>}</aside></section>
 <section className="managementPanel checkinList"><div className="panelHeader"><h3>Listado operativo</h3><label className="searchBox compact"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar..."/></label></div><div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Asistente</th><th>Círculo</th><th>Mesa</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><strong>{row.full_name}</strong><br/><small>{row.qr_code}</small></td><td>{row.circles?.name??"—"}</td><td>{row.gala_tables?.name??"Sin asignar"}</td><td><span className={row.checked_in?"statusConfirmed":"statusPending"}>{row.checked_in?"Ingresó":"Pendiente"}</span></td><td><button className="adminAction" disabled={row.checked_in} onClick={()=>manual(row)}>{row.checked_in?"Registrado":"Registrar"}</button></td></tr>)}</tbody></table></div></section></main></AdminShell>;
}
