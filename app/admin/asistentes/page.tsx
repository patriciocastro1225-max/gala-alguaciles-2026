"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { createAttendee, deleteAttendee, listAttendees, updateAttendee } from "@/services/attendees";
import { listCircles } from "@/services/circles";
import { requireSupabase } from "@/services/helpers";
import { assignTable, listTables } from "@/services/tables";
import type { GalaTable } from "@/types/database";
type SeatRow={attendee_id:string;seat_number:number;guest_name:string;qr_code:string};
import type { Attendee } from "@/types/database";

const empty = {
  full_name: "", email: "", phone: "", circle_id: "",
  companion_name: "", seats_reserved: 1, payment_status: "Pendiente",
  attendance_status: "Pendiente", dietary_notes: "", notes: "",
};

export default function AttendeesPage() {
  const attendees = useAsyncData(listAttendees, []);
  const circles = useAsyncData(listCircles, []);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [seats,setSeats]=useState<SeatRow[]>([]);
  const [tables,setTables]=useState<GalaTable[]>([]);
  const [seatError,setSeatError]=useState("");
  const [seatBusy,setSeatBusy]=useState("");
  const [expanded,setExpanded]=useState<string[]>([]);
  async function reloadSeats(){
    try{
      const client=requireSupabase();
      const [seatResult,tableRows]=await Promise.all([client.from("attendee_seats").select("attendee_id,seat_number,guest_name,qr_code").order("seat_number"),listTables()]);
      if(seatResult.error)throw seatResult.error;
      setSeats((seatResult.data??[]) as SeatRow[]);
      setTables(tableRows);
      setSeatError("");
    }catch(e){setSeatError(e instanceof Error?e.message:"No se pudieron cargar los cupos.");}
  }
  useEffect(()=>{void reloadSeats();},[]);
  async function changeTable(row:Attendee,tableId:string){
    setSeatBusy(row.id);
    try{await assignTable(row.id,tableId||null);await attendees.reload();await reloadSeats();}
    catch(e){setSeatError(e instanceof Error?e.message:"No fue posible asignar mesa.");}
    finally{setSeatBusy("");}
  }
  const seatsByAttendee=useMemo(()=>{const map=new Map<string,SeatRow[]>();for(const s of seats){const list=map.get(s.attendee_id)??[];list.push(s);map.set(s.attendee_id,list);}return map;},[seats]);

  const rows = useMemo(() => (attendees.data ?? []).filter(row =>
    `${row.full_name} ${row.email ?? ""} ${row.circles?.name ?? ""}`.toLowerCase().includes(query.toLowerCase())
  ), [attendees.data, query]);

  function openNew() { setEditing(null); setForm(empty); setModal(true); }
  function openEdit(row: Attendee) {
    setEditing(row.id);
    setForm({
      full_name: row.full_name, email: row.email ?? "", phone: row.phone ?? "",
      circle_id: row.circle_id ?? "", companion_name: row.companion_name ?? "",
      seats_reserved: Math.max(1, Number(row.seats_reserved) || (row.companion_name ? 2 : 1)),
      payment_status: row.payment_status, attendance_status: row.attendance_status,
      dietary_notes: row.dietary_notes ?? "", notes: row.notes ?? "",
    });
    setModal(true);
  }

  async function save() {
    if (!form.full_name.trim()) return;
    const count = Number(form.seats_reserved);
    if (!Number.isInteger(count) || count < 1 || count > 12) { alert("Los cupos deben estar entre 1 y 12."); return; }
    if (form.companion_name.trim() && count < 2) { alert("Una inscripción con acompañante requiere al menos 2 cupos."); return; }
    setSaving(true);
    const payload = {
      ...form,
      circle_id: form.circle_id || null,
      email: form.email || null,
      phone: form.phone || null,
      companion_name: form.companion_name || null,
      seats_reserved: count,
      dietary_notes: form.dietary_notes || null,
      notes: form.notes || null,
    };
    try {
      if (editing) await updateAttendee(editing, payload);
      else await createAttendee(payload);
      setModal(false);
      await attendees.reload();
      await reloadSeats();
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este asistente de la base de datos?")) return;
    await deleteAttendee(id);
    await attendees.reload();
  }

  function exportCsv() {
    const header = "Titular,Nombre del asistente,Cupo,Correo,Teléfono,Círculo,Asistencia,Pago,Mesa,QR\n";
    const body = rows.flatMap(r => {
      const group=seatsByAttendee.get(r.id)??[];
      return (group.length?group:[{attendee_id:r.id,seat_number:1,guest_name:r.full_name,qr_code:r.qr_code}]).map(s=>[
        r.full_name,s.guest_name,s.seat_number,r.email??"",r.phone??"",r.circles?.name??"",
        r.attendance_status,r.payment_status,r.gala_tables?.name??"",s.qr_code
      ].map(v=>`"${String(v).replaceAll('"','""')}"`).join(","));
    }).join("\\n").replaceAll("\\n","\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "asistentes-gala-2026.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div><p className="adminEyebrow">Base de datos real</p><h1>Asistentes</h1><p>Altas, modificaciones y eliminaciones persistentes en Supabase.</p></div>
          <button className="adminAction primary" onClick={openNew}><Plus size={18}/> Nuevo asistente</button>
        </section>

        {seatError&&<div className="dataError">{seatError}</div>}
        {(attendees.error || circles.error) && <div className="dataError">{attendees.error || circles.error}</div>}
        <section className="managementPanel">
          <div className="toolbar">
            <label className="searchBox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar asistente..."/></label>
            <button className="adminAction" onClick={exportCsv}><Download size={17}/> Exportar CSV</button>
          </div>
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead><tr><th>Asistente / cupos</th><th>Círculo</th><th>Asistencia</th><th>Pago</th><th>Mesa</th><th>QR</th><th>Acciones</th></tr></thead>
              <tbody>
                {attendees.loading && <tr><td colSpan={7}>Cargando desde Supabase…</td></tr>}
                {rows.map(row => <tr key={row.id}>
                  <td><strong>{row.full_name}</strong><br/><small>{row.email || row.phone || "Sin contacto"}</small><br/><button className="adminAction" onClick={()=>setExpanded(prev=>prev.includes(row.id)?prev.filter(id=>id!==row.id):[...prev,row.id])}>{expanded.includes(row.id)?"Ocultar":"Ver"} {seatsByAttendee.get(row.id)?.length??Math.max(1,Number(row.seats_reserved)||1)} asistentes</button></td>
                  <td>{row.circles?.name ?? "Sin Círculo"}</td>
                  <td><span className={row.attendance_status === "Confirmado" ? "statusConfirmed" : "statusPending"}>{row.attendance_status}</span></td>
                  <td><span className={row.payment_status === "Pagado" || row.payment_status === "Invitación" ? "statusConfirmed" : row.payment_status === "Parcial" ? "statusPartial" : "statusPending"}>{row.payment_status}</span></td>
                  <td><select aria-label={`Mesa para ${row.full_name}`} value={row.table_id??""} disabled={seatBusy===row.id} onChange={e=>void changeTable(row,e.target.value)}><option value="">Sin asignar</option>{tables.map(t=><option key={t.id} value={t.id}>{t.name} ({t.available??t.capacity} libres)</option>)}</select></td>
                  <td><code>{row.qr_code}</code></td>
                  <td><span className="rowActions"><button onClick={()=>openEdit(row)}><Pencil size={17}/></button><button onClick={()=>remove(row.id)}><Trash2 size={17}/></button></span></td>
                </tr>)}{rows.filter(row=>expanded.includes(row.id)).flatMap(row=>(seatsByAttendee.get(row.id)??[]).map(s=><tr key={s.qr_code}><td style={{paddingLeft:28}}>Cupo {s.seat_number}: <strong>{s.guest_name}</strong></td><td>{row.circles?.name??"Sin círculo"}</td><td>{row.attendance_status}</td><td>{row.payment_status}</td><td>{row.gala_tables?.name??"Sin asignar"}</td><td><code>{s.qr_code}</code></td><td>Invitado de {row.full_name}</td></tr>))}</tbody>
              </tbody>
            </table>
          </div>
        </section>

        {modal && <div className="modalLayer"><div className="formModal">
          <div className="modalHeader"><div><p className="adminEyebrow">Registro real</p><h2>{editing ? "Editar asistente" : "Nuevo asistente"}</h2></div><button onClick={()=>setModal(false)}><X/></button></div>
          <div className="formGrid">
            <label>Nombre completo<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
            <label>Correo<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
            <label>Teléfono<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
            <label>Círculo<select value={form.circle_id} onChange={e=>setForm({...form,circle_id:e.target.value})}><option value="">Sin Círculo</option>{(circles.data??[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>Acompañante<input value={form.companion_name} onChange={e=>setForm({...form,companion_name:e.target.value,seats_reserved:e.target.value.trim()?Math.max(2,Number(form.seats_reserved)||1):form.seats_reserved})}/></label>
            <label>Cupos reservados<select value={form.seats_reserved} onChange={e=>setForm({...form,seats_reserved:Number(e.target.value)})}>{Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n} disabled={Boolean(form.companion_name.trim())&&n<2}>{n} {n===1?"persona":"personas"}</option>)}</select></label>
            {form.payment_status==="Invitación"&&<p className="fullField">Cortesía: {form.seats_reserved} {Number(form.seats_reserved)===1?"asistente":"asistentes"} · $0 a pagar. Cada cupo tendrá su QR individual.</p>}
            <label>Asistencia<select value={form.attendance_status} onChange={e=>setForm({...form,attendance_status:e.target.value})}><option>Confirmado</option><option>Pendiente</option><option>Cancelado</option></select></label>
            <label>Pago<select value={form.payment_status} onChange={e=>setForm({...form,payment_status:e.target.value})}><option>Pagado</option><option>Pendiente</option><option>Parcial</option><option>Invitación</option></select></label>
            <label>Restricciones alimentarias<input value={form.dietary_notes} onChange={e=>setForm({...form,dietary_notes:e.target.value})}/></label>
            <label className="fullField">Notas<textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
          </div>
          <div className="modalActions"><button className="adminAction" onClick={()=>setModal(false)}>Cancelar</button><button className="adminAction primary" disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar"}</button></div>
        </div></div>}
      </main>
    </AdminShell>
  );
}
