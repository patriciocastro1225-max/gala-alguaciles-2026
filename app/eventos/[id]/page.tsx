"use client";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { requireSupabase } from "@/services/helpers";
import { detalle, Evento } from "@/services/eventos";

import "./registro.css";

export default function Inscripcion() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento>(),
    [aviso, setAviso] = useState(""),
    [busy, setBusy] = useState(false),
    [ok, setOk] = useState(false),
    [key, setKey] = useState("");
  useEffect(() => {
    let live = true;
    setOk(false);
    setEvento(undefined);
    setAviso("");
    setKey(crypto.randomUUID());
    requireSupabase()
      .rpc("ficha_evento", { clave: id })
      .then(({ data, error }) => {
        if (live) {
          setEvento(data ?? undefined);
          if (error || !data) setAviso("Evento no disponible.");
        }
      });
    return () => {
      live = false;
    };
  }, [id]);
  async function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!evento || busy) return;
    setBusy(true);
    setAviso("");
    const form = new FormData(ev.currentTarget);
    const personas = Array.from({ length: evento.integrantes }, (_, i) => ({
      nombre: form.get("nombre" + i),
      telefono: form.get("telefono"+i),
      email: form.get("email"+i),
      tipo: form.get("tipo" + i),
      documento: form.get("doc" + i),
    }));
    try {
      const { error } = await requireSupabase().rpc("inscribir_evento_contacto", {
        clave: id,
        solicitud: key,
        personas,
      });
      if (error) setAviso(error.message);
      else setOk(true);
    } finally {
      setBusy(false);
    }
  }
  if (!evento)
    return <main className="registroEvento">{aviso || "Cargando evento…"}</main>;
  const lleno =
    (evento.ocupados ?? 0) +
      (evento.unidad === "equipos" ? 1 : evento.integrantes) >
    evento.limite;
  return (
    <main className="registroEvento">
      <div className="registroPanel"><header><h1>{evento.nombre}</h1>
      <p>{detalle(evento)}</p></header><section>
      {ok ? (
        <h2>Inscripción confirmada</h2>
      ) : !evento.abierto || lleno ? (
        <p>{evento.abierto ? "Cupos agotados" : "Inscripciones cerradas"}</p>
      ) : (
        <form onSubmit={submit}>
          {Array.from({ length: evento.integrantes }, (_, i) => (
            <fieldset key={i}>
              <legend>{evento.integrantes===1?"Datos del asistente":"Integrante "+(i+1)}</legend><div className="registroCampos">
              <label>
                Nombre completo{" "}
                <input required maxLength={160} name={"nombre" + i} />
              </label>
              <label>Teléfono<input required type="tel" maxLength={32} autoComplete={"section-p"+i+" tel"} name={"telefono"+i}/></label>
              <label>Correo electrónico<input required type="email" maxLength={254} autoComplete={"section-p"+i+" email"} name={"email"+i}/></label>
              {evento.documento !== "omitido" && (
                <>
                  <label>
                    Tipo de documento{" "}
                    <select name={"tipo" + i}>
                      {evento.tipos.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Número de documento ({evento.documento}){" "}
                    <input
                      maxLength={60}
                      required={evento.documento === "obligatorio"}
                      name={"doc" + i}
                    />
                  </label>
                </>
              )}
            </div></fieldset>
          ))}
          <button className="registroEnviar" disabled={busy}>
            {busy?"Enviando…":"Confirmar inscripción"}
          </button>
          <p role="alert">{aviso}</p>
        </form>
      )}
    </section></div></main>
  );
}
