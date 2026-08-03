"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ConfirmationClient() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  const token = params.get("token") ?? "";

  return (
    <main className="guestExperience guestCenter">
      <article className="guestConfirmationCard">
        <div className="guestCheck">✓</div>
        <p className="guestEyebrow">Inscripción recibida</p>
        <h1>Muchas gracias</h1>
        <p>Su inscripción fue recibida correctamente.</p>
        <div className="guestCodeBox">
          <span>Número de inscripción</span>
          <strong>{code}</strong>
        </div>
        <p>Su registro quedó pendiente de validación por el Comité Organizador.</p>
        <Link
          className="guestPrimary guestLinkButton"
          href={`/i/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`}
        >
          Ir a mi Portal
        </Link>
      </article>
    </main>
  );
}
