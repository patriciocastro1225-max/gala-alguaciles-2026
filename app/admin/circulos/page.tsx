"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { deleteCircle, listCircles, saveCircle } from "@/services/circles";
import type { Circle } from "@/types/database";

export default function CirclesPage() {
  const source = useAsyncData(listCircles, []);
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<string|null>(null);
  const [form,setForm]=useState({name:"",city:"",president:"",confirmed:false});

  function edit(row?: Circle){
    setEditing(row?.id ?? null);
    setForm(row ? {name:row.name,city:row.city??"",president:row.president??"",confirmed:row.confirmed} : {name:"",city:"",president:"",confirmed:false});
    setModal(true);
  }
  async function save(){ await saveCircle({...form,city:form.city||null,president:form.president||null},editing??undefined); setModal(false); await source.reload(); }
  async function remove(id:string){ if(confirm("¿Eliminar este Círculo?")){await deleteCircle(id);await source.reload();}}

  return <AdminShell><main className="adminPage">
    <section className="pageHeading"><div><p className="adminEyebrow">Base real</p><h1>Círculos participantes</h1><p>Información persistente y disponible para todos los módulos.</p></div><button className="adminAction primary" onClick={()=>edit()}><Plus size={18}/> Nuevo Círculo</button></section>
    {source.error&&<div className="dataError">{source.error}</div>}
    <section className="circleRealGrid">
      {source.loading&&<div className="dataLoading">Cargando Círculos…</div>}
      {(source.data??[]).map(row=><article key={row.id}>
        <span className={row.confirmed?"statusConfirmed":"statusPending"}>{row.confirmed?"Confirmado":"Pendiente"}</span>
        <h3>{row.name}</h3><p>{row.city||"Ciudad no informada"}</p><small>Presidente: {row.president||"Sin registrar"}</small>
        <div className="rowActions"><button onClick={()=>edit(row)}><Pencil size={17}/></button><button onClick={()=>remove(row.id)}><Trash2 size={17}/></button></div>
      </article>)}
    </section>
    {modal&&<div className="modalLayer"><div className="formModal">
      <div className="modalHeader"><h2>{editing?"Editar Círculo":"Nuevo Círculo"}</h2><button onClick={()=>setModal(false)}><X/></button></div>
      <div className="formGrid">
        <label>Nombre<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Ciudad<input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label>
        <label>Presidente<input value={form.president} onChange={e=>setForm({...form,president:e.target.value})}/></label>
        <label className="checkLabel"><input type="checkbox" checked={form.confirmed} onChange={e=>setForm({...form,confirmed:e.target.checked})}/> Participación confirmada</label>
      </div>
      <div className="modalActions"><button className="adminAction" onClick={()=>setModal(false)}>Cancelar</button><button className="adminAction primary" onClick={save}>Guardar</button></div>
    </div></div>}
  </main></AdminShell>;
}
