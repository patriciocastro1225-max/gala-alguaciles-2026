import { ShieldCheck } from "lucide-react";
import type { Attendee } from "@/types/database";

export default function DigitalCredential({ attendee }: { attendee: Attendee }) {
  return (
    <article className="digitalCredential">
      <header><span className="credentialSeal"><ShieldCheck /></span><div><small>Credencial oficial</small><strong>II Gran Gala Nacional 2026</strong></div></header>
      <div className="credentialBody">
        <p>Invitado</p><h2>{attendee.full_name}</h2>
        <dl>
          <div><dt>Círculo</dt><dd>{attendee.circles?.name ?? "Invitado institucional"}</dd></div>
          <div><dt>Mesa</dt><dd>{attendee.gala_tables ? `${attendee.gala_tables.name} · Nº ${attendee.gala_tables.table_number}` : "Por asignar"}</dd></div>
          <div><dt>Estado</dt><dd>{attendee.payment_status}</dd></div>
        </dl>
        <div className="credentialQr" aria-label={`Código ${attendee.qr_code}`}>
          <span>{attendee.qr_code.slice(0,4)}</span><span>{attendee.qr_code.slice(4,8)}</span><span>{attendee.qr_code.slice(8,12)}</span>
        </div>
        <code>{attendee.qr_code}</code>
      </div>
      <footer>25 · NOV · 2026 — CLUB PALESTINO</footer>
    </article>
  );
}
