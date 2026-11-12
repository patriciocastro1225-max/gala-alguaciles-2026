"use client";

import { useEffect } from "react";
import { CircleDollarSign, TableProperties, UserCheck, UsersRound } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getDashboardMetrics } from "@/services/dashboard";

const money = (value: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

export default function DashboardPage() {
  const { data, loading, error, reload } = useAsyncData(getDashboardMetrics, []);

  useEffect(() => {
    const timer = window.setInterval(() => reload(), 15000);
    return () => window.clearInterval(timer);
  }, [reload]);

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Información en tiempo real</p>
            <h1>Dashboard</h1>
            <p>Indicadores calculados desde Supabase y actualizados automáticamente cada 15 segundos.</p>
          </div>
          <button className="adminAction" onClick={reload}>Actualizar</button>
        </section>

        {error && (
          <div className="dataError">
            <strong>No fue posible leer la base de datos.</strong>
            <p>{error}</p>
            <small>Ejecuta el archivo database.sql en Supabase → SQL Editor y vuelve a cargar esta página.</small>
          </div>
        )}
        {loading && <div className="dataLoading">Cargando indicadores reales…</div>}

        {data && (
          <>
            <section className="analyticsKpis">
              <article><UsersRound /><span>Inscritos</span><strong>{data.registered}</strong><small>Registros reales</small></article>
              <article><UsersRound /><span>Asistentes</span><strong>{data.total_attendees}</strong><small>Cupos reservados, sin cancelados</small></article>
              <article><UsersRound /><span>Invitados de cortesía</span><strong>{data.invited_attendees}</strong><small>{data.invited_registrations} inscripciones · Sin cobro</small></article>
              <article><UserCheck /><span>Confirmados</span><strong>{data.confirmed}</strong><small>{data.checked_in} ya ingresaron</small></article>
              <article><CircleDollarSign /><span>Recaudación</span><strong>{money(data.collected)}</strong><small>{data.payment_pending} pagos pendientes</small></article>
              <article><TableProperties /><span>Mesas</span><strong>{data.total_tables}</strong><small>{data.assigned_seats} de {data.total_capacity} asientos asignados</small></article>
            </section>

            <section className="managementPanel" style={{marginTop:24,padding:20}}>
              <h3>Inscritos por círculo</h3>
              <p>Personas inscritas, incluidos acompañantes y cupos de mesas completas. No considera inscripciones canceladas.</p>
              <div className="adminTableWrap">
                <table className="adminTable">
                  <thead><tr><th>Círculo</th><th>Inscripciones</th><th>Personas</th></tr></thead>
                  <tbody>
                    {data.circles_summary.map(group=><tr key={group.circle}><td><strong>{group.circle}</strong></td><td>{group.registrations}</td><td><strong>{group.people}</strong></td></tr>)}
                    <tr><td><strong>TOTAL</strong></td><td><strong>{data.circles_summary.reduce((sum,g)=>sum+g.registrations,0)}</strong></td><td><strong>{data.circles_summary.reduce((sum,g)=>sum+g.people,0)}</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section className="productionStatus">
              <h3>Estado operativo</h3>
              <div>
                <span><b style={{ width: `${data.total_capacity ? Math.min(100, data.assigned_seats / data.total_capacity * 100) : 0}%` }} /></span>
                <p>Ocupación de mesas: <strong>{data.total_capacity ? Math.round(data.assigned_seats / data.total_capacity * 100) : 0}%</strong></p>
              </div>
              <div>
                <span><b style={{ width: `${data.registered ? Math.min(100, data.confirmed / data.registered * 100) : 0}%` }} /></span>
                <p>Confirmación de inscripciones: <strong>{data.registered ? Math.round(data.confirmed / data.registered * 100) : 0}%</strong></p>
              </div>
            </section>
          </>
        )}
      </main>
    </AdminShell>
  );
}
