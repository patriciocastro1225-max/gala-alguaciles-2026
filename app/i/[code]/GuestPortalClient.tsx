"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { getGuestPortal } from "@/services/publicRegistration";
import styles from "./portal.module.css";

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

  if (error) return <main className={styles.loading}><article className={`${styles.loadingCard} ${styles.error}`}><h1>ENLACE NO DISPONIBLE</h1><p>{error}</p></article></main>;
  if (!data) return <main className={styles.loading}><article className={styles.loadingCard}><p>CARGANDO PORTAL…</p></article></main>;

  const paid = data.payment_status === "Pagado" || data.payment_status === "Validado";
  const invited = data.payment_status === "Invitación";
  const receiptReview = data.payment_status === "Pendiente de validación" || data.payment_status === "En revisión";
  const registrationConfirmed = data.attendance_status !== "Cancelado";
  const paymentLabel = invited ? "INVITACIÓN" : receiptReview ? "PENDIENTE DE VALIDACIÓN" : paid ? "PAGADO" : "PENDIENTE DE PAGO";
  const paymentClass = invited ? styles.badgeInvite : receiptReview ? styles.badgeReview : paid ? styles.badgePaid : styles.badgePending;
  const qrValue = data.qr_code || data.registration_code;

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <span className={styles.seal}>II</span>
          <div><strong>II GRAN GALA NACIONAL DE LOS ALGUACILES DE CHILE 2026</strong><small>PORTAL PERSONAL DEL INVITADO</small></div>
        </header>

        <section className={styles.hero}>
          <article className={`${styles.card} ${styles.welcome}`}>
            <p className={styles.eyebrow}>BIENVENIDO</p>
            <h1 className={styles.name}>{data.full_name}</h1>
            <p className={styles.circle}>{data.circle || "CÍRCULO POR INFORMAR"}</p>

            <div className={styles.confirmed}>
              <span className={styles.check}>✓</span>
              <div><strong>{registrationConfirmed ? "INSCRIPCIÓN CONFIRMADA" : "ASISTENCIA CANCELADA"}</strong><span>{registrationConfirmed ? "SU INSCRIPCIÓN HA SIDO RECIBIDA CORRECTAMENTE." : "SU ASISTENCIA FIGURA COMO CANCELADA."}</span></div>
            </div>

            <div className={styles.statusRow}>
              <div className={styles.statusItem}><span>MESA</span><strong>{data.table_name || "POR ASIGNAR"}</strong></div>
              <div className={styles.statusItem}><span>ACOMPAÑANTE</span><strong>{data.companion_name || "NO REGISTRADO"}</strong></div>
              <div className={styles.statusItem}><span>ESTADO DE PAGO</span><strong className={paymentClass}>{paymentLabel}</strong></div>
            </div>
          </article>

          <article className={`${styles.card} ${styles.qr}`}>
            <h2>CÓDIGO DE ACREDITACIÓN</h2>
            <div className={styles.qrBox}>
              <div className={styles.qrPaper}>
                <QRCodeSVG value={String(qrValue)} size={220} level="H" includeMargin={false} />
              </div>
              <strong className={styles.registrationCode}>{data.registration_code}</strong>
            </div>
            <small>PRESENTE ESTE QR EL DÍA DEL EVENTO. EL CÓDIGO {data.registration_code} QUEDA COMO RESPALDO.</small>
          </article>
        </section>

        <section className={styles.grid}>
          <article className={`${styles.card} ${styles.section}`}>
            <h2 className={styles.sectionTitle}>INFORMACIÓN DEL EVENTO</h2><div className={styles.divider}/>
            <p className={styles.eventLine}><strong>MIÉRCOLES 25 DE NOVIEMBRE DE 2026</strong>20:00 HORAS</p>
            <p className={styles.eventLine}><strong>CLUB PALESTINO</strong>AVENIDA PRESIDENTE KENNEDY N° 9351<br/>LAS CONDES, SANTIAGO DE CHILE</p>
            <p className={styles.motto}>“PORQUE HAY AMISTADES QUE NACEN DEL SERVICIO… Y TRADICIONES QUE MERECEN CELEBRARSE.”</p>
          </article>

          <article className={`${styles.card} ${styles.section}`}>
            <h2 className={styles.sectionTitle}>SU REGISTRO</h2><div className={styles.divider}/>
            <div className={styles.record}>
              <div className={styles.row}><span>CÍRCULO</span><strong>{data.circle || "POR INFORMAR"}</strong></div>
              <div className={styles.row}><span>MESA</span><strong>{data.table_name || "POR ASIGNAR"}</strong></div>
              <div className={styles.row}><span>ACOMPAÑANTE</span><strong>{data.companion_name || "NO REGISTRADO"}</strong></div>
              <div className={styles.row}><span>ESTADO DE PAGO</span><strong className={paymentClass}>{paymentLabel}</strong></div>
            </div>

            {!paid && !invited && !receiptReview && <div className={styles.paymentActions}>
              <button type="button" className={styles.primary} disabled>PAGAR AHORA CON TARJETA DE CRÉDITO</button>
              <span className={styles.or}>O</span>
              <Link className={styles.secondary} href={`/inscripcion?payment=transferencia&code=${encodeURIComponent(data.registration_code)}&token=${encodeURIComponent(token)}`}>YA PAGUÉ POR TRANSFERENCIA · SUBIR COMPROBANTE</Link>
            </div>}
            {receiptReview && <div className={styles.notice}>SU COMPROBANTE FUE RECIBIDO Y ESTÁ PENDIENTE DE VALIDACIÓN POR EL COMITÉ ORGANIZADOR.</div>}
            {paid && <div className={styles.notice}>SU PAGO SE ENCUENTRA CONFIRMADO.</div>}
            {invited && <div className={styles.notice}>SU REGISTRO HA SIDO MARCADO COMO INVITACIÓN POR LA ADMINISTRACIÓN.</div>}
          </article>

          <article className={`${styles.card} ${styles.section}`}>
            <h2 className={styles.sectionTitle}>CRONOLOGÍA</h2><div className={styles.divider}/>
            <div className={styles.timeline}>
              {(data.timeline || []).map((item: any, index: number) => <div className={styles.timelineItem} key={index}>
                <strong>{new Date(item.created_at).toLocaleDateString("es-CL")}</strong>
                <span>{String(item.title || "ACTUALIZACIÓN").toUpperCase()}</span>
                <small>{String(item.description || "")}</small>
              </div>)}
              {(!data.timeline || data.timeline.length === 0) && <div className={styles.timelineItem}><strong>REGISTRO ACTIVO</strong><span>INSCRIPCIÓN RECIBIDA</span><small>SU INSCRIPCIÓN SE ENCUENTRA REGISTRADA EN EL SISTEMA.</small></div>}
            </div>
            {!paid && !invited && !receiptReview && <div className={styles.notice}><strong>PRÓXIMO PASO</strong><br/>REALICE EL PAGO PARA COMPLETAR EL PROCESO.</div>}
          </article>
        </section>

        <footer className={styles.footer}>
          <div><strong>II GRAN GALA NACIONAL DE LOS ALGUACILES DE CHILE 2026</strong><br/><span>25 DE NOVIEMBRE DE 2026 · CLUB PALESTINO, LAS CONDES</span></div>
          <div><strong className={styles.help}>¿NECESITA AYUDA?</strong><br/><span>CONTACTE AL COMITÉ ORGANIZADOR AL +56 9 9330 8539.</span></div>
        </footer>
      </div>
    </main>
  );
}
