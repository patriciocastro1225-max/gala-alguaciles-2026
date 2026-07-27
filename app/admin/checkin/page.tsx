"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  LogIn,
  QrCode,
  Search,
  ShieldCheck,
  UserCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

type Entry = {
  id: string;
  name: string;
  table: string;
  circle: string;
  checkedIn: boolean;
  time?: string;
};

const initial: Entry[] = [
  { id: "GALA-0001", name: "Eduardo Martínez Azócar", table: "Mesa 1", circle: "Círculo Mayor", checkedIn: true, time: "20:04" },
  { id: "GALA-0002", name: "Rodrigo Ponce", table: "Mesa 4", circle: "Servicios Diplomáticos", checkedIn: true, time: "20:08" },
  { id: "GALA-0003", name: "Fernando Pérez", table: "Sin asignar", circle: "40ª COP FF.EE.", checkedIn: false },
  { id: "GALA-0004", name: "María Elena Cofré", table: "Mesa 2", circle: "60ª Comisaría Metro", checkedIn: false },
  { id: "GALA-0005", name: "Donatto González", table: "Mesa 8", circle: "Rancagua", checkedIn: false },
];

export default function CheckinPage() {
  const [rows, setRows] = useState(initial);
  const [code, setCode] = useState("");
  const [query, setQuery] = useState("");
  const [last, setLast] = useState<Entry | null>(rows[1]);
  const [error, setError] = useState("");

  const filtered = useMemo(
    () => rows.filter((row) => `${row.name} ${row.id} ${row.circle}`.toLowerCase().includes(query.toLowerCase())),
    [rows, query]
  );

  const checked = rows.filter((row) => row.checkedIn).length;

  function register(entry: Entry) {
    if (entry.checkedIn) {
      setLast(entry);
      setError("Este asistente ya registró su ingreso.");
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const updated = { ...entry, checkedIn: true, time };

    setRows((current) => current.map((item) => item.id === entry.id ? updated : item));
    setLast(updated);
    setCode("");
    setError("");
  }

  function scanCode() {
    const match = rows.find((row) => row.id.toLowerCase() === code.trim().toLowerCase());
    if (!match) {
      setError("Código no encontrado. Verifica la credencial.");
      setLast(null);
      return;
    }
    register(match);
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Control de acceso</p>
            <h1>Check-in de asistentes</h1>
            <p>Registra ingresos mediante QR o búsqueda manual.</p>
          </div>
        </section>

        <section className="checkinStats">
          <div><UsersRound /><span>Confirmados</span><strong>186</strong></div>
          <div><UserCheck /><span>Ingresaron</span><strong>{checked}</strong></div>
          <div><Clock3 /><span>Pendientes</span><strong>{186 - checked}</strong></div>
          <div><ShieldCheck /><span>Accesos duplicados</span><strong>0</strong></div>
        </section>

        <section className="checkinWorkspace">
          <article className="scannerPanel">
            <div className="scannerVisual">
              <div className="scannerCorners">
                <span /><span /><span /><span />
              </div>
              <QrCode size={84} />
              <strong>Escáner QR</strong>
              <p>En producción se habilitará la cámara del dispositivo.</p>
            </div>

            <div className="manualCode">
              <label>
                Ingresar código manualmente
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && scanCode()}
                  placeholder="Ejemplo: GALA-0003"
                />
              </label>
              <button className="adminAction primary" onClick={scanCode}>
                <LogIn size={18} /> Registrar ingreso
              </button>
            </div>
          </article>

          <aside className="checkinResult">
            <p className="panelEyebrow">Último registro</p>
            {last ? (
              <div className={error ? "entryResult warning" : "entryResult success"}>
                {error ? <XCircle /> : <CheckCircle2 />}
                <span>{error ? "Atención" : "Ingreso autorizado"}</span>
                <h2>{last.name}</h2>
                <p>{last.circle}</p>
                <dl>
                  <div><dt>Mesa</dt><dd>{last.table}</dd></div>
                  <div><dt>Hora</dt><dd>{last.time ?? "—"}</dd></div>
                  <div><dt>Código</dt><dd>{last.id}</dd></div>
                </dl>
                {error && <small>{error}</small>}
              </div>
            ) : (
              <div className="entryResult warning">
                <XCircle />
                <span>Código no válido</span>
                <h2>No encontrado</h2>
                <small>{error}</small>
              </div>
            )}
          </aside>
        </section>

        <section className="managementPanel checkinList">
          <div className="panelHeader">
            <div>
              <p className="panelEyebrow">Listado operativo</p>
              <h3>Registro de asistentes</h3>
            </div>
            <label className="searchBox compact">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar..." />
            </label>
          </div>

          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr><th>Asistente</th><th>Círculo</th><th>Mesa</th><th>Ingreso</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong><br /><small>{row.id}</small></td>
                    <td>{row.circle}</td>
                    <td>{row.table}</td>
                    <td>
                      <span className={row.checkedIn ? "statusConfirmed" : "statusPending"}>
                        {row.checkedIn ? `Ingresó ${row.time}` : "Pendiente"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="adminAction"
                        disabled={row.checkedIn}
                        onClick={() => register(row)}
                      >
                        {row.checkedIn ? "Registrado" : "Registrar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AdminShell>
  );
}
