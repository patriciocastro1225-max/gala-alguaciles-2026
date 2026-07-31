"use client";

import { QRCodeSVG } from "qrcode.react";
import type { Attendee } from "@/types/database";

export default function DigitalCredential({ attendee }: { attendee: Attendee }) {
  const table = attendee.gala_tables
    ? `${attendee.gala_tables.name} · Nº ${attendee.gala_tables.table_number}`
    : "Por asignar";

  return (
    <article className="labelCredential" aria-label={`Etiqueta de ${attendee.full_name}`}>
      <section className="labelIdentity">
        <div className="labelBrand"><span>II</span><div><small>Gran Gala Nacional</small><strong>Alguaciles de Chile 2026</strong></div></div>
        <p className="labelRole">INVITADO OFICIAL</p>
        <h2>{attendee.full_name}</h2>
        <p className="labelCircle">{attendee.circles?.name ?? "Invitado institucional"}</p>
        <dl>
          <div><dt>Mesa</dt><dd>{table}</dd></div>
          <div><dt>Estado</dt><dd>{attendee.attendance_status}</dd></div>
        </dl>
      </section>
      <section className="labelQrBlock">
        <QRCodeSVG value={attendee.qr_code} size={132} level="H" marginSize={2} title={`QR de ${attendee.full_name}`} />
        <code>{attendee.qr_code}</code>
      </section>
    </article>
  );
}
