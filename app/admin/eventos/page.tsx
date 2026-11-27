"use client";
import { FormEvent, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import AdminShell from "@/components/admin/AdminShell";
import { requireSupabase } from "@/services/helpers";
import { defaults, detalle, Evento, Inscrito } from "@/services/eventos";

const gala = {
  ...defaults,
  nombre: "II Gran Gala Nacional 2026",
  fecha: "2026-11-25",
  hora: "20:00",
  recinto: "Club Palestino",
  mesas: true,
};
export default function Eventos() {
  return (
    <AdminShell>
      <Editor />
    </AdminShell>
  );
}
function Editor() {
  const client = requireSupabase();
  const [events, setEvents] = useState<Evento[]>([]),
    [id, setId] = useState(""),
    [form, setForm] = useState(defaults);
  const [people, setPeople] = useState<Inscrito[]>([]),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const current = events.find((e) => e.id === id);
  useEffect(() => {
    let live = true;
    client
      .from("eventos")
      .select("*")
      .order("fecha", { ascending: false })
      .then(({ data, error }) => {
        if (live) {
          if (error) setNotice(error.message);
          else setEvents(data ?? []);
        }
      });
    return () => {
      live = false;
    };
  }, [client, revision]);
  useEffect(() => {
    let live = true;
    setPeople([]);
    if (id) {
      (async () => {
        const rows: Inscrito[] = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await client
            .from("evento_inscritos")
            .select("id,nombre,mesa,grupo,ingreso,telefono,email")
            .eq("evento", id)
            .order("nombre")
            .order("id")
            .range(offset, offset + 499);
          if (!live) return;
          if (error) {
            setNotice(error.message);
            return;
          }
          rows.push(...data);
          if (data.length < 500) break;
        }
        setPeople(rows);
      })();
    }
    return () => {
      live = false;
    };
  }, [client, id, revision]);
  function select(e?: Evento) {
    setNotice("");
    setId(e?.id ?? "");
    setForm(e ?? defaults);
  }
  function copy(e: typeof defaults) {
    select();
    setForm({ ...e, nombre: e.nombre + " (copia)", fecha: "", abierto: false });
  }
  async function copyGala() {
    const { data, error } = await client
      .from("gala_tables")
      .select("name")
      .order("table_number");
    if (error) {
      setNotice(error.message);
      return;
    }
    copy({ ...gala, nombres_mesas: data.map((table) => String(table.name)) });
  }
  function change<K extends keyof typeof defaults>(
    k: K,
    v: (typeof defaults)[K],
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  async function save(ev: FormEvent) {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const payload = Object.fromEntries(
        Object.keys(defaults).map((k) => [k, form[k as keyof typeof defaults]]),
      );
      const query = id
        ? client.from("eventos").update(payload).eq("id", id)
        : client.from("eventos").insert(payload);
      const { data, error } = await query.select("*").single();
      if (error) setNotice(error.message);
      else {
        select(data);
        setRevision((v) => v + 1);
        setNotice("Evento guardado.");
      }
    } finally {
      setBusy(false);
    }
  }
  const [code, setCode] = useState("");
  async function checkIn(ev: FormEvent) {
    ev.preventDefault();
    const person = people.find((p) => p.id === code.trim());
    if (!person) {
      setNotice("Credencial desconocida para este evento.");
      return;
    }
    const { data, error } = await client
      .from("evento_inscritos")
      .update({ ingreso: new Date().toISOString() })
      .eq("evento", id)
      .eq("id", person.id)
      .is("ingreso", null)
      .select("id");
    setNotice(
      error
        ? error.message
        : data?.length
          ? "Ingreso registrado: " + person.nombre
          : "La credencial ya registró ingreso.",
    );
    setCode("");
    setRevision((v) => v + 1);
  }
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (!printing) return;
    const reset = () => setPrinting(false);
    window.addEventListener("afterprint", reset);
    window.print();
    return () => window.removeEventListener("afterprint", reset);
  }, [printing]);
  return (
    <main className="adminPage">
      <div className="eventEditor">
        <h1>Eventos</h1>
        <p>
          <a href="/admin/dashboard">Historial de la Gala 2026</a> ·{" "}
          <button onClick={copyGala}>Usar plantilla de la Gala</button>
        </p>
        <label>
          Evento{" "}
          <select
            value={id}
            onChange={(e) =>
              select(events.find((v) => v.id === e.target.value))
            }
          >
            <option value="">Nuevo evento</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => select()}>Crear evento</button>
        {current && (
          <button onClick={() => copy(current)}>Duplicar evento</button>
        )}
        <form onSubmit={save}>
          <fieldset>
            <legend>Datos del evento</legend>
            {(
              [
                ["nombre", "Nombre", "text"],
                ["fecha", "Fecha", "date"],
                ["hora", "Hora local", "time"],
                ["recinto", "Recinto", "text"],
                ["direccion", "Dirección", "text"],
              ] as const
            ).map(([k, label, type]) => (
              <label key={k}>
                {label}
                <input
                  required
                  type={type}
                  value={form[k]}
                  onChange={(e) => change(k, e.target.value)}
                />
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Inscripciones</legend>
            <label>
              <input
                type="checkbox"
                checked={form.abierto}
                onChange={(e) => change("abierto", e.target.checked)}
              />
              Inscripciones abiertas
            </label>
            <label>
              Contar cupos por{" "}
              <select
                value={form.unidad}
                onChange={(e) => change("unidad", e.target.value)}
              >
                <option value="personas">Personas</option>
                <option value="equipos">Equipos</option>
              </select>
            </label>
            <label>
              Cupo máximo{" "}
              <input
                type="number"
                required
                min="1"
                value={form.limite}
                onChange={(e) => change("limite", Number(e.target.value))}
              />
            </label>
            <label>
              Personas por inscripción{" "}
              <input
                type="number"
                required
                min="1"
                max="50"
                value={form.integrantes}
                onChange={(e) => change("integrantes", Number(e.target.value))}
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Identificación</legend>
            <label>
              Documento{" "}
              <select
                value={form.documento}
                onChange={(e) => change("documento", e.target.value)}
              >
                {["omitido", "opcional", "obligatorio"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            {form.documento !== "omitido" &&
              ["RUT", "DNI", "Pasaporte"].map((v) => (
                <label key={v}>
                  <input
                    type="checkbox"
                    checked={form.tipos.includes(v)}
                    onChange={(e) =>
                      change(
                        "tipos",
                        e.target.checked
                          ? [...form.tipos, v]
                          : form.tipos.filter((t) => t !== v),
                      )
                    }
                  />
                  {v}
                </label>
              ))}
          </fieldset>
          <fieldset>
            <legend>Organización</legend>
            {(
              [
                ["mesas", "Asignar mesas"],
                ["credenciales", "Emitir credenciales QR"],
              ] as const
            ).map(([k, label]) => (
              <label key={k}>
                <input
                  type="checkbox"
                  checked={form[k]}
                  onChange={(e) => change(k, e.target.checked)}
                />
                {label}
              </label>
            ))}
            {form.mesas && (
              <label>
                Nombres de mesas (una por línea)
                <textarea
                  value={form.nombres_mesas.join("\n")}
                  onChange={(e) =>
                    change("nombres_mesas", e.target.value.split("\n"))
                  }
                />
              </label>
            )}
          </fieldset>
          <button
            className="adminAction primary"
            disabled={
              busy || (form.documento !== "omitido" && !form.tipos.length)
            }
          >
            Guardar evento
          </button>
        </form>
        <p role="status">{notice}</p>
        {current && (
          <section>
            <h2>{current.nombre}</h2>
            <p>{detalle(current)}</p>
            <a href={"/eventos/" + id}>Abrir enlace público de inscripción</a>
            <p>
              {current.unidad === "personas"
                ? people.length
                : new Set(people.map((p) => p.grupo)).size}{" "}
              de {current.limite} {current.unidad} · {people.length} asistentes
            </p>
            <button onClick={() => setRevision((v) => v + 1)}>
              Actualizar listado
            </button>{" "}
            <button onClick={() => window.print()}>Imprimir listado</button>{" "}
            {current.credenciales && (
              <button
                disabled={!people.length}
                onClick={() => setPrinting(true)}
              >
                Imprimir credenciales QR
              </button>
            )}
            <datalist id="mesas-evento">
              {current.nombres_mesas.filter(Boolean).map((mesa, i) => (
                <option key={i} value={mesa} />
              ))}
            </datalist>
            {current.credenciales && (
              <form onSubmit={checkIn}>
                <label>
                  Registrar ingreso con lector QR{" "}
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </label>
                <button>Registrar ingreso</button>
              </form>
            )}
            <table>
              <thead>
                <tr>
                  <th>Nombre</th><th>Teléfono</th><th>Correo electrónico</th>
                  {current.mesas && <th>Mesa</th>}
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td><td>{p.telefono || "—"}</td><td>{p.email || "—"}</td>
                    {current.mesas && (
                      <td>
                        <input
                          list="mesas-evento"
                          aria-label={"Mesa de " + p.nombre}
                          key={p.id + p.mesa}
                          defaultValue={p.mesa}
                          onBlur={async (e) => {
                            const mesa = e.target.value.trim();
                            if (mesa === p.mesa) return;
                            const { error } = await client
                              .from("evento_inscritos")
                              .update({ mesa })
                              .eq("evento", id)
                              .eq("id", p.id);
                            if (error) setNotice(error.message);
                            else setRevision((v) => v + 1);
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
      {printing && current && (
        <div className="eventCards">
          {people.map((p) => (
            <article key={p.id}>
              <strong>{current.nombre}</strong>
              <h2>{p.nombre}</h2>
              <QRCodeSVG value={p.id} size={80} />
              <p>{detalle(current)}</p>
              {current.mesas && p.mesa && <b>Mesa {p.mesa}</b>}
            </article>
          ))}
        </div>
      )}
      <style>{`.eventEditor fieldset{display:flex;gap:1rem;flex-wrap:wrap;margin:1rem 0;padding:1rem}.eventEditor label{display:inline-flex;align-items:center;gap:.5rem}.eventEditor input,.eventEditor select,.eventEditor button{padding:.45rem}.eventCards{display:grid;grid-template-columns:1fr 1fr}.eventCards article{break-inside:avoid;text-align:center;border:1px solid;padding:1rem}@media print{.adminSidebar,.adminTopbar,.eventEditor button,.eventEditor form,.eventEditor>label,.eventEditor>p,.eventEditor a{display:none!important}main:has(.eventCards) .eventEditor{display:none}}`}</style>
    </main>
  );
}
