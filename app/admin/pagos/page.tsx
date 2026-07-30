"use client";

import { useMemo, useState } from "react";
import { CircleDollarSign, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listAttendees } from "@/services/attendees";
import { deletePayment, listPayments, savePayment } from "@/services/payments";
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
  const rows=useMemo(()=>(payments.data??[]).filter(r=>`${r.attendees?.full_name??""} ${r.reference??""}`.toLowerCase().includes(query.toLowerCase())),[payments.data,query]);
  const collected=rows.filter(r=>r.status==="Pagado"||r.status==="Parcial").reduce((s,r)=>s+r.amount,0);

  function open(row?:Payment){setEditing(row?.id??null);setForm(row?{attendee_id:row.attendee_id,amount:row.amount,method:row.method,status:row.status,payment_date:row.payment_date??"",reference:row.reference??""}:empty);setModal(true);}
  async function save(){await savePayment({...form,payment_date:form.payment_date||null,reference:form.reference||null},editing??undefined);setModal(false);await Promise.all([payments.reload(),attendees.reload()]);}
  async function remove(id:string){if(confirm("¿Eliminar este pago?")){await deletePayment(id);await payments.reload();}}

  return <AdminShell><main className="adminPage">
    <section className="pageHeading"><div><p className="adminEyebrow">Finanzas reales</p><h1>Pagos</h1><p>Los movimientos quedan guardados y sincronizados con el estado del asistente.</p></div><button className="adminAction primary" onClick={()=>open()}><Plus size={18}/> Registrar pago</button></section>
    <section className="financeCards">
      <article><CircleDollarSign/><span>Recaudado</span><strong>{money(collected)}</strong></article>
      <article><CircleDollarSign/><span>Registros</span><strong>{rows.length}</strong></article>
      <article><CircleDollarSign/><span>Pagados</span><strong>{rows.filter(r=>r.status==="Pagado").length}</strong></article>
      <article><CircleDollarSign/><span>Pendientes</span><strong>{rows.filter(r=>r.status==="Pendiente").length}</strong></article>
    </section>
    {payments.error&&<div className="dataError">{payments.error}</div>}
    <section className="managementPanel">
      <div className="toolbar"><label className="searchBox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar pago..."/></label></div>
      <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Asistente</th><th>Círculo</th><th>Monto</th><th>Método</th><th>Estado</th><th>Fecha</th><th>Referencia</th><th>Acciones</th></tr></thead>
      <tbody>{payments.loading&&<tr><td colSpan={8}>Cargando pagos…</td></tr>}{rows.map(row=><tr key={row.id}>
        <td><strong>{row.attendees?.full_name??"Asistente eliminado"}</strong></td><td>{row.attendees?.circles?.name??"—"}</td><td>{money(row.amount)}</td><td>{row.method}</td>
        <td><span className={row.status==="Pagado"?"statusConfirmed":row.status==="Parcial"?"statusPartial":"statusPending"}>{row.status}</span></td>
        <td>{row.payment_date??"—"}</td><td>{row.reference??"—"}</td><td><span className="rowActions"><button onClick={()=>open(row)}><Pencil size={17}/></button><button onClick={()=>remove(row.id)}><Trash2 size={17}/></button></span></td>
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
