"use client";

import { Printer, RefreshCw } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { listFinancialSummary } from "@/services/finance";

const money = (value:number) =>
  new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(value);

export default function FinancialReportPage() {
  const source = useAsyncData(listFinancialSummary, []);
  const rows = (source.data ?? []).filter((row) => row.attendance_status !== "Cancelado");
  const expected = rows.reduce((sum,row) => sum + row.expected_amount, 0);
  const paid = rows.reduce((sum,row) => sum + row.paid_amount, 0);
  const balance = rows.reduce((sum,row) => sum + row.balance, 0);

  return (
    <AdminShell>
      <main className="adminPage financialReport23">
        <section className="pageHeading noPrint22">
          <div>
            <p className="adminEyebrow">Informe financiero</p>
            <h1>Estado de recaudación</h1>
            <p>II Gran Gala Nacional de los Alguaciles de Chile 2026.</p>
          </div>
          <div className="tablePageActions">
            <button className="adminAction" onClick={source.reload}><RefreshCw size={17}/> Actualizar</button>
            <button className="adminAction primary" onClick={() => window.print()}><Printer size={17}/> Imprimir</button>
          </div>
        </section>

        <section className="printFinanceHeader23">
          <h1>II Gran Gala Nacional de los Alguaciles de Chile 2026</h1>
          <p>Informe de recaudación y saldos pendientes</p>
        </section>

        <section className="financeReportTotals23">
          <div><span>Total esperado</span><strong>{money(expected)}</strong></div>
          <div><span>Recaudado</span><strong>{money(paid)}</strong></div>
          <div><span>Saldo pendiente</span><strong>{money(balance)}</strong></div>
        </section>

        <table className="financeReportTable23">
          <thead>
            <tr>
              <th>Invitado</th>
              <th>Círculo</th>
              <th>Estado</th>
              <th>Esperado</th>
              <th>Pagado</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.attendee_id}>
                <td>{row.full_name}</td>
                <td>{row.circle_name ?? "Sin círculo"}</td>
                <td>{row.payment_status}</td>
                <td>{money(row.expected_amount)}</td>
                <td>{money(row.paid_amount)}</td>
                <td>{money(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </AdminShell>
  );
}
