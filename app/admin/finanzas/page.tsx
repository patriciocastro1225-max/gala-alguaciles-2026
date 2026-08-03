"use client";

import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Banknote,
  CircleDollarSign,
  Download,
  Pencil,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listPayments } from "@/services/payments";
import {
  getAdhesionAmount,
  listFinancialSummary,
  saveAdhesionAmount,
} from "@/services/finance";

const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

async function load() {
  const [summary, payments, adhesion] = await Promise.all([
    listFinancialSummary(),
    listPayments(),
    getAdhesionAmount(),
  ]);
  return { summary, payments, adhesion };
}

export default function FinancePage() {
  const source = useAsyncData(load, []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [editFee, setEditFee] = useState(false);
  const [fee, setFee] = useState(75000);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const summary = source.data?.summary ?? [];
  const payments = source.data?.payments ?? [];
  const adhesion = source.data?.adhesion ?? 75000;

  const active = useMemo(
    () => summary.filter((row) => row.attendance_status !== "Cancelado"),
    [summary]
  );

  const totals = useMemo(() => {
    const expected = active.reduce((sum, row) => sum + row.expected_amount, 0);
    const paid = active.reduce((sum, row) => sum + row.paid_amount, 0);
    const balance = active.reduce((sum, row) => sum + row.balance, 0);
    const courtesy = active.filter((row) => row.payment_status === "Invitación").length;
    const paidPeople = active.filter((row) => row.balance === 0 && row.expected_amount > 0).length;
    const pendingPeople = active.filter((row) => row.balance > 0).length;
    return { expected, paid, balance, courtesy, paidPeople, pendingPeople };
  }, [active]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return active.filter((row) => {
      if (
        q &&
        !`${row.full_name} ${row.circle_name ?? ""}`
          .toLowerCase()
          .includes(q)
      ) return false;

      if (filter === "Todos") return true;
      if (filter === "Pagados") return row.balance === 0 && row.expected_amount > 0;
      if (filter === "Pendientes") return row.balance > 0;
      if (filter === "Cortesía") return row.expected_amount === 0;
      return true;
    });
  }, [active, query, filter]);

  const byCircle = useMemo(() => {
    const map = new Map<string, { expected: number; paid: number; balance: number; people: number }>();

    active.forEach((row) => {
      const key = row.circle_name ?? "Sin círculo";
      const current = map.get(key) ?? { expected: 0, paid: 0, balance: 0, people: 0 };
      current.expected += row.expected_amount;
      current.paid += row.paid_amount;
      current.balance += row.balance;
      current.people += 1;
      map.set(key, current);
    });

    return Array.from(map.entries())
      .map(([circle, data]) => ({ circle, ...data }))
      .sort((a, b) => b.paid - a.paid);
  }, [active]);

  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    payments
      .filter((payment) => payment.status === "Pagado" || payment.status === "Parcial")
      .forEach((payment) => {
        map.set(payment.method, (map.get(payment.method) ?? 0) + payment.amount);
      });

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [payments]);

  function openFee() {
    setFee(adhesion);
    setEditFee(true);
  }

  async function saveFee() {
    setSaving(true);
    setMessage("");
    try {
      await saveAdhesionAmount(fee);
      setEditFee(false);
      await source.reload();
      setMessage("Valor de adhesión actualizado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar.");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const rows = [
      ["Invitado", "Círculo", "Estado", "Esperado", "Pagado", "Saldo"],
      ...filtered.map((row) => [
        row.full_name,
        row.circle_name ?? "Sin círculo",
        row.payment_status,
        row.expected_amount,
        row.paid_amount,
        row.balance,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "finanzas-gala-2026.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <main className="adminPage financeControl23">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Versión 2.3</p>
            <h1>Control financiero de la Gala</h1>
            <p>Recaudación, saldos pendientes, cortesías y conciliación por Círculo.</p>
          </div>

          <div className="tablePageActions">
            <button className="adminAction" onClick={source.reload}>
              <RefreshCw size={17} /> Actualizar
            </button>
            <button className="adminAction" onClick={openFee}>
              <Pencil size={17} /> Adhesión {money(adhesion)}
            </button>
            <button className="adminAction primary" onClick={exportCsv}>
              <Download size={17} /> Exportar CSV
            </button>
          </div>
        </section>

        <section className="financeHero23">
          <article>
            <BadgeDollarSign />
            <span>Total esperado</span>
            <strong>{money(totals.expected)}</strong>
          </article>
          <article>
            <Banknote />
            <span>Recaudado</span>
            <strong>{money(totals.paid)}</strong>
          </article>
          <article>
            <WalletCards />
            <span>Saldo pendiente</span>
            <strong>{money(totals.balance)}</strong>
          </article>
          <article>
            <CircleDollarSign />
            <span>Cortesías</span>
            <strong>{totals.courtesy}</strong>
          </article>
        </section>

        <section className="financeMiniStats23">
          <div><span>Pagados</span><strong>{totals.paidPeople}</strong></div>
          <div><span>Con saldo</span><strong>{totals.pendingPeople}</strong></div>
          <div><span>Recaudación</span><strong>{totals.expected ? Math.round((totals.paid / totals.expected) * 100) : 0}%</strong></div>
        </section>

        {message && <div className="operationMessage">{message}</div>}
        {source.error && <div className="dataError">{source.error}</div>}

        <section className="financeGrid23">
          <article className="financePanel23">
            <div className="panelTitle23">
              <div>
                <p className="panelEyebrow">Control individual</p>
                <h2>Estado por invitado</h2>
              </div>
            </div>

            <div className="financeToolbar23">
              <label className="searchBox">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar invitado o Círculo..."
                />
              </label>

              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option>Todos</option>
                <option>Pagados</option>
                <option>Pendientes</option>
                <option>Cortesía</option>
              </select>
            </div>

            <div className="financeRows23">
              <div className="financeRowHeader23">
                <span>Invitado</span>
                <span>Esperado</span>
                <span>Pagado</span>
                <span>Saldo</span>
              </div>

              {filtered.map((row) => (
                <div className="financeRow23" key={row.attendee_id}>
                  <div>
                    <strong>{row.full_name}</strong>
                    <small>{row.circle_name ?? "Sin círculo"} · {row.payment_status}</small>
                  </div>
                  <span>{money(row.expected_amount)}</span>
                  <span>{money(row.paid_amount)}</span>
                  <strong className={row.balance > 0 ? "balancePending23" : "balanceOk23"}>
                    {row.expected_amount === 0 ? "Cortesía" : money(row.balance)}
                  </strong>
                </div>
              ))}
            </div>
          </article>

          <aside className="financeSide23">
            <article className="financePanel23">
              <p className="panelEyebrow">Por Círculo</p>
              <h2>Recaudación</h2>
              <div className="circleFinance23">
                {byCircle.map((row) => (
                  <div key={row.circle}>
                    <span>
                      <strong>{row.circle}</strong>
                      <small>{row.people} invitado(s)</small>
                    </span>
                    <span>
                      <strong>{money(row.paid)}</strong>
                      <small>Saldo {money(row.balance)}</small>
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="financePanel23">
              <p className="panelEyebrow">Conciliación</p>
              <h2>Por medio de pago</h2>
              <div className="methodFinance23">
                {byMethod.map(([method, amount]) => (
                  <div key={method}>
                    <span>{method}</span>
                    <strong>{money(amount)}</strong>
                  </div>
                ))}
                {byMethod.length === 0 && <p>Sin pagos registrados.</p>}
              </div>
            </article>
          </aside>
        </section>

        {editFee && (
          <div className="modalLayer">
            <div className="formModal smallFinanceModal23">
              <div className="modalHeader">
                <div>
                  <p className="adminEyebrow">Configuración financiera</p>
                  <h2>Valor de adhesión</h2>
                </div>
                <button onClick={() => setEditFee(false)}><X /></button>
              </div>

              <p>Este valor se utiliza para calcular la recaudación esperada y el saldo por invitado.</p>

              <label className="feeField23">
                Valor por persona
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={fee}
                  onChange={(event) => setFee(Number(event.target.value))}
                />
              </label>

              <div className="modalActions">
                <button className="adminAction" onClick={() => setEditFee(false)}>Cancelar</button>
                <button className="adminAction primary" disabled={saving} onClick={saveFee}>
                  {saving ? "Guardando…" : "Guardar valor"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminShell>
  );
}
