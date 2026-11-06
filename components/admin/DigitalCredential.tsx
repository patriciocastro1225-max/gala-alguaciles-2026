"use client";

import { QRCodeSVG } from "qrcode.react";
import type { Attendee } from "@/types/database";

export default function DigitalCredential({ attendee, guestName, qrCode }: { attendee: Attendee; guestName?: string; qrCode?: string }) {
  const name = guestName || attendee.full_name;
  const qr = qrCode || attendee.qr_code;
  const table = attendee.gala_tables
    ? `${attendee.gala_tables.name} · Nº ${attendee.gala_tables.table_number}`
    : "Por asignar";

  return (
    <article className="labelCredential" aria-label={`Etiqueta de ${name}`}>
      <section className="labelIdentity">
        <div className="labelBrand"><span>II</span><div><small>Gran Gala Nacional</small><strong>Alguaciles de Chile 2026</strong></div></div>
        <p className="labelRole">INVITADO OFICIAL</p>
        <h2>{name}</h2>
        <p className="labelCircle">{attendee.circles?.name ?? "Invitado institucional"}</p>
        <dl>
          <div><dt>Mesa</dt><dd>{table}</dd></div>
          <div><dt>Estado</dt><dd>{attendee.attendance_status}</dd></div>
        </dl>
      </section>
      <section className="labelQrBlock">
        <QRCodeSVG value={qr} size={132} level="H" marginSize={2} title={`QR de ${name}`} />
        <code>{qr}</code>
      </section>
    </article>
  );
}
