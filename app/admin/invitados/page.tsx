
"use client";

import { useState } from "react";
import { Building2, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

type Guest = { id:number; name:string; role:string; institution:string; status:"Confirmado"|"Pendiente"; order:number; };

const initial: Guest[] = [
  { id:1, name:"Eduardo Martínez Azócar", role:"Presidente", institution:"Círculo Mayor de Amigos de Carabineros de Chile", status:"Confirmado", order:1 },
  { id:2, name:"Invitado institucional N.º 2", role:"Autoridad invitada", institution:"Confirmación próximamente", status:"Pendiente", order:2 },
  { id:3, name:"Invitado nacional N.º 3", role:"Invitado especial", institution:"Confirmación próximamente", status:"Pendiente", order:3 },
];

export default function GuestsPage(){
  const [rows,setRows]=useState(initial);
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<number|null>(null);
  const [form,setForm]=useState({name:"",role:"",institution:"",status:"Pendiente" as Guest["status"],order:1});
  function openNew(){setEditing(null);setForm({name:"",role:"",institution:"",status:"Pendiente",order:rows.length+1});setModal(true)}
  function edit(r:Guest){setEditing(r.id);setForm({name:r.name,role:r.role,institution:r.institution,status:r.status,order:r.order});setModal(true)}
  function save(){if(!form.name.trim())return;if(editing)setRows(rows.map(r=>r.id===editing?{...r,...form}:r));else setRows([...rows,{id:Date.now(),...form}]);setModal(false)}

  return <AdminShell><main className="adminPage">
    <section className="pageHeading"><div><p className="adminEyebrow">Protocolo institucional</p><h1>Invitados especiales</h1><p>Gestiona autoridades, invitados nacionales y su orden de presentación.</p></div><button className="adminAction primary" onClick={openNew}><Plus size={18}/> Nuevo invitado</button></section>
    <section className="guestAdminGrid">
      {rows.sort((a,b)=>a.order-b.order).map(r=><article className="guestAdminCard" key={r.id}>
        
        <span className={r.status==="Confirmado"?"statusConfirmed":"statusPending"}>{r.status}</span>
        <small>Orden de presentación: {r.order}</small>
        <h3>{r.name}</h3><p>{r.role}</p><div className="institution"><Building2 size={16}/>{r.institution}</div>
        <div className="entityActions"><button onClick={()=>edit(r)}><Pencil size={16}/> Editar</button><button onClick={()=>setRows(rows.filter(x=>x.id!==r.id))}><Trash2 size={16}/></button></div>
      </article>)}
    </section>
    {modal&&<div className="modalLayer"><div className="formModal">
      <div className="modalHeader"><div><p className="adminEyebrow">Ficha protocolar</p><h2>{editing?"Editar invitado":"Nuevo invitado"}</h2></div><button onClick={()=>setModal(false)}><X/></button></div>
      <div className="formGrid">
        <label>Nombre completo<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Cargo<input value={form.role} onChange={e=>setForm({...form,role:e.target.value})}/></label>
        <label>Institución<input value={form.institution} onChange={e=>setForm({...form,institution:e.target.value})}/></label>
        <label>Estado<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Guest["status"]})}><option>Confirmado</option><option>Pendiente</option></select></label>
        <label>Orden de presentación<input type="number" min="1" value={form.order} onChange={e=>setForm({...form,order:Number(e.target.value)})}/></label>
      </div>
      <div className="modalActions"><button className="adminAction" onClick={()=>setModal(false)}>Cancelar</button><button className="adminAction primary" onClick={save}>Guardar invitado</button></div>
    </div></div>}
  </main></AdminShell>
}
