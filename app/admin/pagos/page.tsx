"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, Eye, Pencil, Plus, Search, Trash2, X, XCircle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendees } from "@/services/attendees";
import { deletePayment, getPaymentReceiptUrl, listPayments, savePayment, validatePaymentReceipt } from "@/services/payments";
import type { Payment } from "@/types/database";

const money=(n:number)=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
const empty={attendee_id:"",amount:75000,method:"Transferencia",status:"Pendiente",payment_date:"",reference:""};

export default function PaymentsPage(){
  const payments=useAsyncData(listPayments,[]);
  const attendees=useAsyncData(listAttendees,[]);
  const [query,setQuery]=useState("");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<string|null>(null);
  const [form,setForm]=useState<any>(empty);
  const [message,setMessage]=useState("");
  const rows=useMemo(()=>(payments.data??[]).filter(r=>`${r.attendees?.full_name??""} ${r.reference??""} ${r.receipt_original_name??""}`.toLowerCase().includes(query.toLowerCase())),[payments.data,query]);
  const collected=rows.filter(r=>r.status==="Pagado"||r.status==="Parcial").reduce((s,r)=>s+r.amount,0);

  function open(row?:Payment){setEditing(row?.id??null);setForm(row?{attendee_id:row.attendee_id,amount:row.amount,method:row.method,status:row.status,payment_date:row.payment_date??"",reference:row.reference??""}:empty);setModal(true);}
  async function save(){await savePayment({...form,payment_date:form.payment_date||null,reference:form.reference||null},editing??undefined);setModal(false);await Promise.all([payments.reload(),attendees.reload()]);}
  async function remove(id:string){if(confirm("¿Eliminar este pago?")){await deletePayment(id);await payments.reload();}}
  async function viewReceipt(row:Payment){if(!row.receipt_path)return;try{const url=await getPaymentReceiptUrl(row.receipt_path);window.open(url,"_blank","noopener,noreferrer");}catch(error){setMessage(error instanceof Error?error.message:"No fue posible abrir el comprobante.");}}
  async function validateReceipt(row:Payment,decision:"Validado"|"Rechazado"){
    try{
      await validatePaymentReceipt(row,decision);
      setMessage(decision==="Validado"?"Comprobante validado y pago marcado como pagado.":"Comprobante rechazado; el pago continúa pendiente.");
      await Promise.all([payments.reload(),attendees.reload()]);
    }catch(error){setMessage(error instanceof Error?error.message:"No fue posible validar el comprobante.");}
  }

  return <AdminShell><main className="adminPage">
    <section className="pageHeading"><div><p className="adminEyebrow">Finanzas reales</p><h1>Pagos</h1><p>Los movimientos, comprobantes y validaciones quedan guardados en el sistema.</p></div><button className="adminAction primary" onClick={()=>open()}><Plus size={18}/> Registrar pago</button></section>
    <section className="financeCards">
      <article><CircleDollarSign/><span>Recaudado</span><strong>{money(collected)}</strong></article>
      <article><CircleDollarSign/><span>Registros</span><strong>{rows.length}</strong></article>
      <article><CircleDollarSign/><span>Pagados</span><strong>{rows.filter(r=>r.status==="Pagado").length}</strong></article>
      <article><CircleDollarSign/><span>Por validar</span><strong>{rows.filter(r=>r.validation_status==="Pendiente"&&r.receipt_path).length}</strong></article>
    </section>
    {message&&<div className="operationMessage">{message}</div>}
    {payments.error&&<div className="dataError">{payments.error}</div>}
    <section className="managementPanel">
      <div className="toolbar"><label className="searchBox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar pago o comprobante..."/></label></div>
      <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Asistente</th><th>Círculo</th><th>Monto</th><th>Método</th><th>Estado</th><th>Validación</th><th>Comprobante</th><th>Fecha</th><th>Acciones</th></tr></thead>
      <tbody>{payments.loading&&<tr><td colSpan={9}>Cargando pagos…</td></tr>}{rows.map(row=><tr key={row.id}>
        <td><strong>{row.attendees?.full_name??"Asistente eliminado"}</strong></td><td>{row.attendees?.circles?.name??"—"}</td><td>{money(row.amount)}</td><td>{row.method}</td>
        <td><span className={row.status==="Pagado"?"statusConfirmed":row.status==="Parcial"?"statusPartial":"statusPending"}>{row.status}</span></td>
        <td><span className={row.validation_status==="Validado"?"statusConfirmed":row.validation_status==="Rechazado"?"statusCancelled":"statusPending"}>{row.validation_status??"—"}</span></td>
        <td>{row.receipt_path?<button className="adminAction" onClick={()=>viewReceipt(row)}><Eye size={16}/> Ver</button>:"—"}</td>
        <td>{row.payment_date??"—"}</td>
        <td><span className="rowActions">
          {row.receipt_path&&row.validation_status!=="Validado"&&<button title="Validar comprobante" onClick={()=>validateReceipt(row,"Validado")}><CheckCircle2 size={17}/></button>}
          {row.receipt_path&&row.validation_status!=="Rechazado"&&<button title="Rechazar comprobante" onClick={()=>validateReceipt(row,"Rechazado")}><XCircle size={17}/></button>}
          <button onClick={()=>open(row)}><Pencil size={17}/></button><button onClick={()=>remove(row.id)}><Trash2 size={17}/></button>
        </span></td>
      </tr>)}</tbody></table></div>
    </section>
    {modal&&<div className="modalLayer"><div className="formModal">
      <div className="modalHeader"><h2>{editing?"Editar pago":"Registrar pago"}</h2><button onClick={()=>setModal(false)}><X/></button></div>
      <div className="formGrid">
        <label>Asistente<select value={form.attendee_id} onChange={e=>setForm({...form,attendee_id:e.target.value})}><option value="">Seleccione</option>{(attendees.data??[]).map(a=><option key={a.id} value={a.id}>{a.full_name}</option>)}</select></label>
        <label>Monto<input type="number" min="0" value={form.amount} onChange={e=>setForm({...form,amount:Number(e.target.value)})}/></label>
        <label>Método<select value={form.method} onChange={e=>setForm({...form,method:e.target.value})}><option>Transferencia</option><option>Webpay</option><option>Efectivo</option><option>Invitación</option></select></label>
        <label>Estado<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Pagado</option><option>Pendiente</option><option>Parcial</option></select></label>
        <label>Fecha<input type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})}/></label>
        <label>Referencia<input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})}/></label>
      </div>
      <div className="modalActions"><button className="adminAction" onClick={()=>setModal(false)}>Cancelar</button><button className="adminAction primary" disabled={!form.attendee_id} onClick={save}>Guardar</button></div>
    </div></div>}
  </main></AdminShell>;
}
