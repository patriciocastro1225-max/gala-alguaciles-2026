"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

type Payment = {
  id: number;
  attendee: string;
  circle: string;
  amount: number;
  method: "Transferencia" | "Webpay" | "Efectivo" | "Invitación";
  status: "Pagado" | "Pendiente" | "Parcial";
  date: string;
  reference: string;
};

const initial: Payment[] = [
  { id: 1, attendee: "Eduardo Martínez Azócar", circle: "Círculo Mayor", amount: 0, method: "Invitación", status: "Pagado", date: "15-07-2026", reference: "INV-0001" },
  { id: 2, attendee: "Rodrigo Ponce", circle: "Servicios Diplomáticos", amount: 75000, method: "Transferencia", status: "Pagado", date: "18-07-2026", reference: "TRX-88921" },
  { id: 3, attendee: "Fernando Pérez", circle: "40ª COP FF.EE.", amount: 0, method: "Transferencia", status: "Pendiente", date: "", reference: "" },
  { id: 4, attendee: "María Elena Cofré", circle: "60ª Comisaría Metro", amount: 0, method: "Invitación", status: "Pagado", date: "20-07-2026", reference: "INV-0004" },
  { id: 5, attendee: "Donatto González", circle: "Rancagua", amount: 75000, method: "Webpay", status: "Pagado", date: "22-07-2026", reference: "WP-00298" },
  { id: 6, attendee: "Patricio Castro", circle: "40ª COP FF.EE.", amount: 40000, method: "Efectivo", status: "Parcial", date: "23-07-2026", reference: "REC-0006" },
];

const emptyForm = {
  attendee: "",
  circle: "",
  amount: 75000,
  method: "Transferencia" as Payment["method"],
  status: "Pendiente" as Payment["status"],
  date: "",
  reference: "",
};

function money(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PaymentsPage() {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => rows.filter((row) => {
    const text = `${row.attendee} ${row.circle} ${row.reference}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || row.status === statusFilter;
    return matchesQuery && matchesStatus;
  }), [rows, query, statusFilter]);

  const totals = useMemo(() => {
    const collected = rows.filter(r => r.status === "Pagado").reduce((sum, r) => sum + r.amount, 0);
    const partial = rows.filter(r => r.status === "Parcial").reduce((sum, r) => sum + r.amount, 0);
    const pendingCount = rows.filter(r => r.status === "Pendiente").length;
    return { collected, partial, pendingCount, total: collected + partial };
  }, [rows]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(row: Payment) {
    setEditing(row.id);
    setForm({
      attendee: row.attendee,
      circle: row.circle,
      amount: row.amount,
      method: row.method,
      status: row.status,
      date: row.date,
      reference: row.reference,
    });
    setModal(true);
  }

  function save() {
    if (!form.attendee.trim()) return;
    if (editing) {
      setRows(rows.map(row => row.id === editing ? { ...row, ...form } : row));
    } else {
      setRows([{ id: Date.now(), ...form }, ...rows]);
    }
    setModal(false);
  }

  function remove(id: number) {
    if (window.confirm("¿Eliminar este registro de pago?")) {
      setRows(rows.filter(row => row.id !== id));
    }
  }

  function exportCsv() {
    const header = "Asistente,Círculo,Monto,Método,Estado,Fecha,Referencia\n";
    const body = rows.map(r =>
      [r.attendee, r.circle, r.amount, r.method, r.status, r.date, r.reference]
        .map(v => `"${String(v).replaceAll('"', '""')}"`)
        .join(",")
    ).join("\n");

    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pagos-gala-2026.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Control financiero</p>
            <h1>Pagos</h1>
            <p>Administra pagos, invitaciones, abonos y referencias de cada asistente.</p>
          </div>
          <button className="adminAction primary" onClick={openNew}>
            <Plus size={18} /> Registrar pago
          </button>
        </section>

        <section className="financeCards">
          <article>
            <CircleDollarSign />
            <span>Total recaudado</span>
            <strong>{money(totals.total)}</strong>
          </article>
          <article>
            <CheckCircle2 />
            <span>Pagos completos</span>
            <strong>{rows.filter(r => r.status === "Pagado").length}</strong>
          </article>
          <article>
            <Banknote />
            <span>Abonos parciales</span>
            <strong>{money(totals.partial)}</strong>
          </article>
          <article>
            <WalletCards />
            <span>Pendientes</span>
            <strong>{totals.pendingCount}</strong>
          </article>
        </section>

        <section className="managementPanel">
          <div className="toolbar">
            <label className="searchBox">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por asistente, círculo o referencia..."
              />
            </label>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>Todos</option>
              <option>Pagado</option>
              <option>Pendiente</option>
              <option>Parcial</option>
            </select>

            <button className="adminAction" onClick={exportCsv}>
              <Download size={17} /> Exportar CSV
            </button>
          </div>

          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Asistente</th>
                  <th>Círculo</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Referencia</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.attendee}</strong></td>
                    <td>{row.circle}</td>
                    <td>{money(row.amount)}</td>
                    <td>{row.method}</td>
                    <td>
                      <span className={
                        row.status === "Pagado"
                          ? "statusConfirmed"
                          : row.status === "Parcial"
                          ? "statusPartial"
                          : "statusPending"
                      }>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.date || "—"}</td>
                    <td>{row.reference || "—"}</td>
                    <td>
                      <span className="rowActions">
                        <button onClick={() => openEdit(row)} title="Editar"><Pencil size={17} /></button>
                        <button onClick={() => remove(row.id)} title="Eliminar"><Trash2 size={17} /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {modal && (
          <div className="modalLayer">
            <div className="formModal">
              <div className="modalHeader">
                <div>
                  <p className="adminEyebrow">Registro financiero</p>
                  <h2>{editing ? "Editar pago" : "Registrar pago"}</h2>
                </div>
                <button onClick={() => setModal(false)}><X /></button>
              </div>

              <div className="formGrid">
                <label>
                  Asistente
                  <input value={form.attendee} onChange={e => setForm({ ...form, attendee: e.target.value })} />
                </label>
                <label>
                  Círculo
                  <input value={form.circle} onChange={e => setForm({ ...form, circle: e.target.value })} />
                </label>
                <label>
                  Monto
                  <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
                </label>
                <label>
                  Método
                  <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value as Payment["method"] })}>
                    <option>Transferencia</option>
                    <option>Webpay</option>
                    <option>Efectivo</option>
                    <option>Invitación</option>
                  </select>
                </label>
                <label>
                  Estado
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Payment["status"] })}>
                    <option>Pagado</option>
                    <option>Pendiente</option>
                    <option>Parcial</option>
                  </select>
                </label>
                <label>
                  Fecha
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </label>
                <label>
                  Referencia
                  <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
                </label>
              </div>

              <div className="modalActions">
                <button className="adminAction" onClick={() => setModal(false)}>Cancelar</button>
                <button className="adminAction primary" onClick={save}>Guardar pago</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
