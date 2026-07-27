"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Download,
  MapPin,
  TableProperties,
  UserCheck,
  UsersRound,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

const registrations = [
  { month: "Jun", value: 18 },
  { month: "Jul", value: 30 },
  { month: "Ago", value: 48 },
  { month: "Sep", value: 72 },
  { month: "Oct", value: 88 },
  { month: "Nov", value: 64 },
];

const circles = [
  { name: "40ª COP FF.EE.", value: 24 },
  { name: "Servicios Diplomáticos", value: 18 },
  { name: "Círculo Mayor", value: 12 },
  { name: "60ª Comisaría Metro", value: 10 },
  { name: "Rancagua", value: 8 },
];

const paymentMethods = [
  { name: "Transferencia", value: 54 },
  { name: "Webpay", value: 31 },
  { name: "Efectivo", value: 9 },
  { name: "Invitación", value: 6 },
];

export default function StatisticsPage() {
  const [range, setRange] = useState("General");

  function exportReport() {
    const content = [
      ["Indicador", "Valor"],
      ["Inscritos", "186"],
      ["Confirmados", "152"],
      ["Check-in", "142"],
      ["Recaudación", "$11.400.000"],
      ["Ocupación", "75%"],
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "estadisticas-gala-2026.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Análisis ejecutivo</p>
            <h1>Estadísticas</h1>
            <p>Visualiza el avance general de la organización y la asistencia.</p>
          </div>
          <div className="statsActions">
            <select value={range} onChange={(event) => setRange(event.target.value)}>
              <option>General</option>
              <option>Últimos 30 días</option>
              <option>Últimos 7 días</option>
            </select>
            <button className="adminAction" onClick={exportReport}>
              <Download size={17} /> Exportar informe
            </button>
          </div>
        </section>

        <section className="analyticsKpis">
          <article><UsersRound /><span>Inscritos</span><strong>186</strong><small>74,4% de capacidad</small></article>
          <article><UserCheck /><span>Confirmados</span><strong>152</strong><small>81,7% de inscritos</small></article>
          <article><CircleDollarSign /><span>Recaudación</span><strong>$11.400.000</strong><small>Incluye abonos</small></article>
          <article><TableProperties /><span>Mesas ocupadas</span><strong>18 / 22</strong><small>4 disponibles</small></article>
        </section>

        <section className="analyticsGrid">
          <article className="analyticsPanel wide">
            <div className="panelHeader">
              <div>
                <p className="panelEyebrow">Evolución</p>
                <h3>Inscripciones mensuales</h3>
              </div>
              <CalendarDays size={20} />
            </div>
            <div className="analyticsBars">
              {registrations.map((item) => (
                <div key={item.month}>
                  <span>{item.value}</span>
                  <i style={{ height: `${(item.value / 88) * 100}%` }} />
                  <small>{item.month}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="analyticsPanel">
            <div className="panelHeader">
              <div>
                <p className="panelEyebrow">Participación</p>
                <h3>Estado general</h3>
              </div>
              <BarChart3 size={20} />
            </div>

            <div className="donutWrap">
              <div className="analyticsDonut">
                <div><strong>81,7%</strong><span>confirmados</span></div>
              </div>
              <ul>
                <li><i className="dotConfirmed" /> Confirmados <strong>152</strong></li>
                <li><i className="dotPending" /> Pendientes <strong>34</strong></li>
              </ul>
            </div>
          </article>

          <article className="analyticsPanel">
            <div className="panelHeader">
              <div>
                <p className="panelEyebrow">Representación</p>
                <h3>Círculos principales</h3>
              </div>
              <MapPin size={20} />
            </div>
            <div className="rankingList">
              {circles.map((item, index) => (
                <div key={item.name}>
                  <span>{index + 1}</span>
                  <strong>{item.name}</strong>
                  <i><b style={{ width: `${(item.value / 24) * 100}%` }} /></i>
                  <em>{item.value}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="analyticsPanel">
            <div className="panelHeader">
              <div>
                <p className="panelEyebrow">Finanzas</p>
                <h3>Métodos de pago</h3>
              </div>
              <CircleDollarSign size={20} />
            </div>
            <div className="methodList">
              {paymentMethods.map((item) => (
                <div key={item.name}>
                  <span>{item.name}</span>
                  <strong>{item.value}%</strong>
                  <i><b style={{ width: `${item.value}%` }} /></i>
                </div>
              ))}
            </div>
          </article>

          <article className="analyticsPanel">
            <div className="panelHeader">
              <div>
                <p className="panelEyebrow">Asistencia</p>
                <h3>Proyección de check-in</h3>
              </div>
              <UserCheck size={20} />
            </div>
            <div className="projectionCard">
              <strong>142</strong>
              <span>asistentes proyectados</span>
              <div><i style={{ width: "76%" }} /></div>
              <small>76% del total inscrito</small>
            </div>
          </article>
        </section>
      </main>
    </AdminShell>
  );
}
