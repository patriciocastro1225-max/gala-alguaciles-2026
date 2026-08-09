"use client";

import Link from "next/link";
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
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "NO FUE POSIBLE ABRIR EL PORTAL."));
  }, [params.code, token]);

  if (error) return <main className="guestExperience guestCenter"><article className="guestConfirmationCard"><h1>ENLACE NO DISPONIBLE</h1><p>{error}</p></article></main>;
  if (!data) return <main className="guestExperience guestCenter"><article className="guestConfirmationCard"><p>CARGANDO PORTAL…</p></article></main>;

  const paid = data.payment_status === "Pagado" || data.payment_status === "Validado";
  const invited = data.payment_status === "Invitación";
  const receiptReview = data.payment_status === "Pendiente de validación" || data.payment_status === "En revisión";
  const registrationConfirmed = data.attendance_status !== "Cancelado";

  return (
    <main className="guestExperience">
      <header className="guestHeader"><span className="guestSeal">II</span><div><strong>PORTAL DEL INVITADO</strong><small>II GRAN GALA NACIONAL · 2026</small></div></header>
      <section className="guestPortal">
        <div className="guestPortalHero">
          <article>
            <p className="guestEyebrow">BIENVENIDO</p>
            <h1>{data.full_name}</h1>
            <div className="guestPills">
              <span className={registrationConfirmed ? "ok" : "warn"}>{registrationConfirmed ? "INSCRIPCIÓN CONFIRMADA" : "ASISTENCIA CANCELADA"}</span>
              <span className={paid || invited ? "ok" : "warn"}>{invited ? "INVITACIÓN" : receiptReview ? "PAGO EN VALIDACIÓN" : paid ? "PAGO CONFIRMADO" : "PENDIENTE DE PAGO"}</span>
              <span className={data.table_name ? "ok" : "warn"}>{data.table_name ? `MESA ${data.table_name}` : "MESA POR ASIGNAR"}</span>
            </div>
          </article>
          <article className="guestQrCard"><span>CÓDIGO DE ACREDITACIÓN</span><div className="guestQrVisual"><strong>{data.qr_code}</strong></div><small>{data.registration_code}</small></article>
        </div>

        <div className="guestPortalGrid">
          <article><h2>INFORMACIÓN DEL EVENTO</h2><p><strong>MIÉRCOLES 25 DE NOVIEMBRE DE 2026</strong><br/>20:00 HORAS</p><p><strong>CLUB PALESTINO</strong><br/>AVENIDA PRESIDENTE KENNEDY N° 9351<br/>LAS CONDES, SANTIAGO DE CHILE</p></article>

          <article><h2>SU REGISTRO</h2><p><strong>CÍRCULO:</strong> {data.circle || "POR INFORMAR"}</p><p><strong>MESA:</strong> {data.table_name || "POR ASIGNAR"}</p><p><strong>ACOMPAÑANTE:</strong> {data.companion_name || "NO REGISTRADO"}</p><p><strong>ESTADO DE PAGO:</strong> {invited ? "INVITACIÓN" : receiptReview ? "PENDIENTE DE VALIDACIÓN" : paid ? "PAGADO" : "PENDIENTE DE PAGO"}</p>
            {!paid && !invited && !receiptReview && <div className="portalPaymentActions"><button type="button" className="guestPrimary" disabled>PAGAR AHORA CON TARJETA DE CRÉDITO</button><span>O</span><Link className="guestSecondary guestLinkButton" href={`/inscripcion?payment=transferencia&code=${encodeURIComponent(data.registration_code)}&token=${encodeURIComponent(token)}`}>YA PAGUÉ POR TRANSFERENCIA · SUBIR COMPROBANTE</Link></div>}
            {receiptReview && <div className="guestNotice">SU COMPROBANTE FUE RECIBIDO Y ESTÁ PENDIENTE DE VALIDACIÓN.</div>}
          </article>

          <article><h2>CRONOLOGÍA</h2><div className="guestTimeline">{(data.timeline || []).map((item: any, index: number) => <div key={index}><strong>{new Date(item.created_at).toLocaleDateString("es-CL")}</strong><span>{item.title}</span><small>{item.description}</small></div>)}</div>{!paid && !invited && !receiptReview && <div className="guestNotice"><strong>PRÓXIMO PASO</strong><br/>REALICE EL PAGO PARA COMPLETAR EL PROCESO DE INSCRIPCIÓN.</div>}</article>
        </div>
      </section>
    </main>
  );
}
