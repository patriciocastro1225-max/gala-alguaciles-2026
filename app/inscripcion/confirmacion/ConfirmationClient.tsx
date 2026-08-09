"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ConfirmationClient() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const token = params.get("token") ?? "";
  const payment = params.get("payment") ?? "pendiente";
  const receiptInReview = payment === "revision";

  return (
    <main className="guestExperience guestCenter">
      <article className="guestConfirmationCard">
        <div className="guestCheck">✓</div>
        <p className="guestEyebrow">INSCRIPCIÓN RECIBIDA</p>
        <h1>MUCHAS GRACIAS</h1>
        <p>SU INSCRIPCIÓN FUE RECIBIDA CORRECTAMENTE.</p>
        <div className="guestCodeBox">
          <span>NÚMERO DE INSCRIPCIÓN</span>
          <strong>{code}</strong>
        </div>
        {receiptInReview ? (
          <p>SU COMPROBANTE DE TRANSFERENCIA FUE RECIBIDO Y QUEDÓ <strong>PENDIENTE DE VALIDACIÓN</strong> POR EL COMITÉ ORGANIZADOR.</p>
        ) : (
          <p>SU PAGO CONTINÚA PENDIENTE. PODRÁ COMPLETARLO POSTERIORMENTE.</p>
        )}
        <p>SU ASISTENCIA HA QUEDADO REGISTRADA COMO CONFIRMADA.</p>
        <Link className="guestPrimary guestLinkButton" href={`/i/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`}>
          IR A MI PORTAL
        </Link>
      </article>
    </main>
  );
}
