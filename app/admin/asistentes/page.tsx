"use client";

import { useMemo, useState } from "react";
import { Download, Mail, Pencil, Plus, Search, Trash2, UserPlus, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

type Attendee = {
  id: number;
  name: string;
  circle: string;
  companion: string;
  payment: "Pagado" | "Pendiente" | "Invitación";
  table: string;
  status: "Confirmado" | "Pendiente";
  email: string;
};

const initial: Attendee[] = [
  { id: 1, name: "Eduardo Martínez Azócar", circle: "Círculo Mayor", companion: "Distinguida señora", payment: "Invitación", table: "Mesa 1", status: "Confirmado", email: "eduardo@example.cl" },
  { id: 2, name: "Rodrigo Ponce", circle: "Servicios Diplomáticos", companion: "Sí", payment: "Pagado", table: "Mesa 4", status: "Confirmado", email: "rodrigo@example.cl" },
  { id: 3, name: "Fernando Pérez", circle: "40ª COP FF.EE.", companion: "Sí", payment: "Pendiente", table: "Sin asignar", status: "Pendiente", email: "fernando@example.cl" },
  { id: 4, name: "María Elena Cofré", circle: "60ª Comisaría Metro", companion: "No", payment: "Invitación", table: "Mesa 2", status: "Confirmado", email: "maria@example.cl" },
  { id: 5, name: "Donatto González", circle: "Rancagua", companion: "Sí", payment: "Pagado", table: "Mesa 8", status: "Confirmado", email: "donatto@example.cl" },
];

const emptyForm = {
  name: "", circle: "", companion: "No", payment: "Pendiente" as Attendee["payment"],
  table: "Sin asignar", status: "Pendiente" as Attendee["status"], email: ""
};

export default function AttendeesPage() {
  const [rows, setRows] = useState<Attendee[]>(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => rows.filter(row => {
    const text = `${row.name} ${row.circle} ${row.email}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesFilter = filter === "Todos" || row.status === filter || row.payment === filter;
    return matchesQuery && matchesFilter;
  }), [rows, query, filter]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(row: Attendee) {
    setEditingId(row.id);
    setForm({
      name: row.name, circle: row.circle, companion: row.companion,
      payment: row.payment, table: row.table, status: row.status, email: row.email
    });
    setModal(true);
  }

  function save() {
    if (!form.name.trim() || !form.circle.trim()) return;
    if (editingId) {
      setRows(rows.map(row => row.id === editingId ? { ...row, ...form } : row));
    } else {
      setRows([{ id: Date.now(), ...form }, ...rows]);
    }
    setModal(false);
  }

  function remove(id: number) {
    if (window.confirm("¿Eliminar este asistente de la demostración?")) {
      setRows(rows.filter(row => row.id !== id));
    }
  }

  function exportCsv() {
    const header = "Nombre,Círculo,Acompañante,Pago,Mesa,Estado,Correo\n";
    const body = rows.map(r => [r.name,r.circle,r.companion,r.payment,r.table,r.status,r.email]
      .map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "asistentes-gala-2026.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Gestión de asistentes</p>
            <h1>Asistentes</h1>
            <p>Registra, edita y controla la situación de cada persona invitada.</p>
          </div>
          <button className="adminAction primary" onClick={openNew}><UserPlus size={18}/> Nuevo asistente</button>
        </section>

        <section className="summaryStrip">
          <div><span>Total</span><strong>{rows.length}</strong></div>
          <div><span>Confirmados</span><strong>{rows.filter(r=>r.status==="Confirmado").length}</strong></div>
          <div><span>Pagados</span><strong>{rows.filter(r=>r.payment==="Pagado").length}</strong></div>
          <div><span>Pendientes</span><strong>{rows.filter(r=>r.status==="Pendiente").length}</strong></div>
        </section>

        <section className="managementPanel">
          <div className="toolbar">
            <label className="searchBox">
              <Search size={18}/>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nombre, círculo o correo..." />
            </label>
            <select value={filter} onChange={e=>setFilter(e.target.value)}>
              <option>Todos</option><option>Confirmado</option><option>Pendiente</option><option>Pagado</option><option>Invitación</option>
            </select>
            <button className="adminAction" onClick={exportCsv}><Download size={17}/> Exportar CSV</button>
          </div>

          <div className="adminTableWrap">
            <table className="adminTable">
              <thead><tr><th>Nombre</th><th>Círculo</th><th>Acompañante</th><th>Pago</th><th>Mesa</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td><span className="tablePerson"><i>{row.name[0]}</i><span><strong>{row.name}</strong><small>{row.email}</small></span></span></td>
                    <td>{row.circle}</td><td>{row.companion}</td>
                    <td><span className={`paymentTag payment-${row.payment.toLowerCase()}`}>{row.payment}</span></td>
                    <td>{row.table}</td>
                    <td><span className={row.status==="Confirmado"?"statusConfirmed":"statusPending"}>{row.status}</span></td>
                    <td><span className="rowActions">
                      <button title="Enviar correo"><Mail size={17}/></button>
                      <button title="Editar" onClick={()=>openEdit(row)}><Pencil size={17}/></button>
                      <button title="Eliminar" onClick={()=>remove(row.id)}><Trash2 size={17}/></button>
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {modal && <div className="modalLayer">
          <div className="formModal">
            <div className="modalHeader"><div><p className="adminEyebrow">{editingId?"Editar registro":"Nuevo registro"}</p><h2>{editingId?"Editar asistente":"Agregar asistente"}</h2></div><button onClick={()=>setModal(false)}><X/></button></div>
            <div className="formGrid">
              <label>Nombre completo<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
              <label>Correo<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
              <label>Círculo<input value={form.circle} onChange={e=>setForm({...form,circle:e.target.value})}/></label>
              <label>Acompañante<select value={form.companion} onChange={e=>setForm({...form,companion:e.target.value})}><option>No</option><option>Sí</option><option>Distinguida señora</option></select></label>
              <label>Pago<select value={form.payment} onChange={e=>setForm({...form,payment:e.target.value as Attendee["payment"]})}><option>Pagado</option><option>Pendiente</option><option>Invitación</option></select></label>
              <label>Mesa<input value={form.table} onChange={e=>setForm({...form,table:e.target.value})}/></label>
              <label>Estado<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Attendee["status"]})}><option>Confirmado</option><option>Pendiente</option></select></label>
            </div>
            <div className="modalActions"><button className="adminAction" onClick={()=>setModal(false)}>Cancelar</button><button className="adminAction primary" onClick={save}>Guardar asistente</button></div>
          </div>
        </div>}
      </main>
    </AdminShell>
  );
}
