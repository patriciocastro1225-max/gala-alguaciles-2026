"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getGuestPortal } from "@/services/publicRegistration";

export default function GuestPortalClient() {
  const params = useParams<{ code: string }>();
  const query = useSearchParams();
  const token = query.get("token") ?? "";
  const [data, setData] = useState<any>();
  const [error, setError] = useState("");

  useEffect(() => {
    getGuestPortal(decodeURIComponent(params.code), token)
      .then(setData)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "No fue posible abrir el portal.")
      );
  }, [params.code, token]);

  if (error) {
    return (
      <main className="guestExperience guestCenter">
        <article className="guestConfirmationCard">
          <h1>Enlace no disponible</h1>
          <p>{error}</p>
        </article>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="guestExperience guestCenter">
        <article className="guestConfirmationCard">
          <p>Cargando portal…</p>
        </article>
      </main>
    );
  }

  return (
    <main className="guestExperience">
      <header className="guestHeader">
        <span className="guestSeal">II</span>
        <div>
          <strong>Portal del Invitado</strong>
          <small>Gala Nacional 2026</small>
        </div>
      </header>
      <section className="guestPortal">
        <div className="guestPortalHero">
          <article>
            <p className="guestEyebrow">Bienvenido</p>
            <h1>{data.full_name}</h1>
            <div className="guestPills">
              <span className={data.validation_status === "Aprobado" ? "ok" : "warn"}>
                {data.validation_status}
              </span>
              <span className="warn">{data.payment_status}</span>
              <span className={data.table_name ? "ok" : "warn"}>
                {data.table_name || "Mesa por confirmar"}
              </span>
            </div>
          </article>
          <article className="guestQrCard">
            <span>Código de acreditación</span>
            <div className="guestQrVisual">
              <strong>{data.qr_code}</strong>
            </div>
            <small>{data.registration_code}</small>
          </article>
        </div>
        <div className="guestPortalGrid">
          <article>
            <h2>Información del evento</h2>
            <p>25 de noviembre de 2026 · 20:00 horas</p>
            <p>Club Palestino, Las Condes</p>
          </article>
          <article>
            <h2>Su registro</h2>
            <p><strong>Círculo:</strong> {data.circle || "Por informar"}</p>
            <p><strong>Mesa:</strong> {data.table_name || "Por asignar"}</p>
            <p><strong>Acompañante:</strong> {data.companion_name || "No registrado"}</p>
          </article>
          <article>
            <h2>Cronología</h2>
            <div className="guestTimeline">
              {(data.timeline || []).map((item: any, index: number) => (
                <div key={index}>
                  <strong>{new Date(item.created_at).toLocaleDateString("es-CL")}</strong>
                  <span>{item.title}</span>
                  <small>{item.description}</small>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
