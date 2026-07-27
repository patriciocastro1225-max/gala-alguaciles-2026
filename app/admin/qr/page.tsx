"use client";

import { useMemo, useState } from "react";
import { Download, Mail, QrCode, RefreshCw, Search } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

const guests = [
  { id: "GALA-0001", name: "Eduardo Martínez Azócar", table: "Mesa 1", circle: "Círculo Mayor", status: "Activo" },
  { id: "GALA-0002", name: "Rodrigo Ponce", table: "Mesa 4", circle: "Servicios Diplomáticos", status: "Activo" },
  { id: "GALA-0003", name: "Fernando Pérez", table: "Sin asignar", circle: "40ª COP FF.EE.", status: "Pendiente" },
  { id: "GALA-0004", name: "María Elena Cofré", table: "Mesa 2", circle: "60ª Comisaría Metro", status: "Activo" },
  { id: "GALA-0005", name: "Donatto González", table: "Mesa 8", circle: "Rancagua", status: "Activo" },
];

export default function QRPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(guests[0].id);
  const [message, setMessage] = useState("");

  const filtered = useMemo(
    () => guests.filter((guest) => `${guest.name} ${guest.circle} ${guest.id}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  const selected = guests.find((guest) => guest.id === selectedId) ?? guests[0];

  function fakeAction(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Credenciales digitales</p>
            <h1>Códigos QR</h1>
            <p>Genera y administra la credencial individual de cada asistente.</p>
          </div>
        </section>

        <section className="qrWorkspace">
          <article className="qrListPanel">
            <label className="searchBox">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar asistente..." />
            </label>

            <div className="qrGuestList">
              {filtered.map((guest) => (
                <button
                  key={guest.id}
                  className={selected.id === guest.id ? "qrGuest active" : "qrGuest"}
                  onClick={() => setSelectedId(guest.id)}
                >
                  <span>{guest.name.charAt(0)}</span>
                  <div>
                    <strong>{guest.name}</strong>
                    <small>{guest.circle} · {guest.table}</small>
                  </div>
                  <i className={guest.status === "Activo" ? "statusConfirmed" : "statusPending"}>{guest.status}</i>
                </button>
              ))}
            </div>
          </article>

          <article className="credentialCard">
            <div className="credentialTop">
              <span>II</span>
              <div>
                <small>Credencial oficial</small>
                <strong>Gran Gala Nacional 2026</strong>
              </div>
            </div>

            <div className="visualQr" aria-label={`Código QR demostrativo de ${selected.name}`}>
              {Array.from({ length: 144 }).map((_, index) => (
                <i key={index} className={(index * 7 + selected.id.length + index % 5) % 3 === 0 ? "dark" : ""} />
              ))}
              <div className="qrCenter">II</div>
            </div>

            <h2>{selected.name}</h2>
            <p>{selected.circle}</p>

            <dl>
              <div><dt>Mesa</dt><dd>{selected.table}</dd></div>
              <div><dt>Código</dt><dd>{selected.id}</dd></div>
              <div><dt>Estado</dt><dd>{selected.status}</dd></div>
            </dl>

            <div className="credentialActions">
              <button className="adminAction" onClick={() => fakeAction("QR regenerado correctamente.")}>
                <RefreshCw size={17} /> Regenerar
              </button>
              <button className="adminAction" onClick={() => fakeAction("Credencial preparada para descarga.")}>
                <Download size={17} /> Descargar
              </button>
              <button className="adminAction primary" onClick={() => fakeAction("Credencial preparada para envío por correo.")}>
                <Mail size={17} /> Enviar
              </button>
            </div>
            {message && <p className="sendFeedback">{message}</p>}
          </article>
        </section>
      </main>
    </AdminShell>
  );
}
