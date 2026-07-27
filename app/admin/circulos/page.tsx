"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, ShieldCheck, Trash2, UsersRound, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

type Circle = { id:number; name:string; city:string; president:string; attendees:number; confirmed:boolean; };

const initial: Circle[] = [
  { id:1, name:"Círculo Mayor de Amigos de Carabineros", city:"Santiago", president:"Eduardo Martínez Azócar", attendees:12, confirmed:true },
  { id:2, name:"Círculo Servicios Diplomáticos", city:"Santiago", president:"Rodrigo Ponce", attendees:18, confirmed:true },
  { id:3, name:"40ª COP FF.EE.", city:"Santiago", president:"Patricio Castro", attendees:24, confirmed:true },
  { id:4, name:"60ª Comisaría Metro", city:"Santiago", president:"Por confirmar", attendees:10, confirmed:true },
  { id:5, name:"Círculo de Rancagua", city:"Rancagua", president:"Por confirmar", attendees:8, confirmed:false },
];

export default function CirclesPage() {
  const [rows,setRows] = useState(initial);
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState<number|null>(null);
  const [form,setForm] = useState({name:"",city:"",president:"",attendees:0,confirmed:false});

  function openNew(){ setEditing(null); setForm({name:"",city:"",president:"",attendees:0,confirmed:false}); setModal(true); }
  function edit(row:Circle){ setEditing(row.id); setForm({name:row.name,city:row.city,president:row.president,attendees:row.attendees,confirmed:row.confirmed}); setModal(true); }
  function save(){
    if(!form.name.trim()) return;
    if(editing) setRows(rows.map(r=>r.id===editing?{...r,...form}:r));
    else setRows([...rows,{id:Date.now(),...form}]);
    setModal(false);
  }

  return <AdminShell><main className="adminPage">
    <section className="pageHeading"><div><p className="adminEyebrow">Participación nacional</p><h1>Círculos</h1><p>Administra los Círculos participantes y su representación en la Gala.</p></div><button className="adminAction primary" onClick={openNew}><Plus size={18}/> Nuevo círculo</button></section>

    <section className="circleCards">
      {rows.map(row=><article className="entityCard" key={row.id}>
        <div className="entityIcon"><ShieldCheck/></div>
        <span className={row.confirmed?"statusConfirmed":"statusPending"}>{row.confirmed?"Confirmado":"Pendiente"}</span>
        <h3>{row.name}</h3>
        <p><MapPin size={16}/>{row.city}</p>
        <dl><div><dt>Presidente</dt><dd>{row.president}</dd></div><div><dt>Asistentes</dt><dd><UsersRound size={16}/>{row.attendees}</dd></div></dl>
        <div className="entityActions"><button onClick={()=>edit(row)}><Pencil size={16}/> Editar</button><button onClick={()=>setRows(rows.filter(r=>r.id!==row.id))}><Trash2 size={16}/></button></div>
      </article>)}
    </section>

    {modal&&<div className="modalLayer"><div className="formModal">
      <div className="modalHeader"><div><p className="adminEyebrow">Círculos participantes</p><h2>{editing?"Editar círculo":"Nuevo círculo"}</h2></div><button onClick={()=>setModal(false)}><X/></button></div>
      <div className="formGrid">
        <label>Nombre del círculo<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Ciudad<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label>
        <label>Presidente<input value={form.president} onChange={e=>setForm({...form,president:e.target.value})}/></label>
        <label>Número de asistentes<input type="number" min="0" value={form.attendees} onChange={e=>setForm({...form,attendees:Number(e.target.value)})}/></label>
        <label className="checkLabel"><input type="checkbox" checked={form.confirmed} onChange={e=>setForm({...form,confirmed:e.target.checked})}/> Participación confirmada</label>
      </div>
      <div className="modalActions"><button className="adminAction" onClick={()=>setModal(false)}>Cancelar</button><button className="adminAction primary" onClick={save}>Guardar círculo</button></div>
    </div></div>}
  </main></AdminShell>
}
