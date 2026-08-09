"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAttendee } from "@/services/publicRegistration";

const steps = ["DATOS PERSONALES", "INFORMACIÓN INSTITUCIONAL", "PARTICIPACIÓN", "ALIMENTACIÓN", "PAGO", "CONFIRMACIÓN"];
const upper = (value: string) => value.toLocaleUpperCase("es-CL");

const initialForm = {
  full_name: "", email: "", phone: "", circle_name: "", attendance_status: "Confirmado", has_companion: "No",
  companion_name: "", companion_email: "", companion_phone: "", companion_rut: "", companion_institution: "", companion_position: "", companion_dietary_notes: "",
  dietary_notes: "", payment_status: "Pendiente", notes: "", consent: false,
};

export default function RegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<any>(initialForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  const updateUpper = (key: string, value: string) => update(key, upper(value));

  function validateCurrentStep() {
    if (step === 0 && (!form.full_name.trim() || !form.email.trim() || !form.phone.trim())) { setError("COMPLETE NOMBRE, CORREO Y TELÉFONO."); return false; }
    if (step === 2 && form.has_companion === "Sí" && !form.companion_name.trim()) { setError("INGRESE EL NOMBRE COMPLETO DEL ACOMPAÑANTE."); return false; }
    if (step === 5 && !form.consent) { setError("DEBE ACEPTAR LA POLÍTICA DE PRIVACIDAD Y EL TRATAMIENTO DE DATOS."); return false; }
    setError(""); return true;
  }

  async function next() {
    if (!validateCurrentStep()) return;
    if (step < steps.length - 1) { setStep((value) => value + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setBusy(true);
    try {
      const companionSummary = form.has_companion === "Sí" ? [
        `ACOMPAÑANTE: ${form.companion_name}`, form.companion_rut ? `RUT: ${form.companion_rut}` : "", form.companion_email ? `CORREO: ${form.companion_email}` : "",
        form.companion_phone ? `CELULAR: ${form.companion_phone}` : "", form.companion_institution ? `INSTITUCIÓN: ${form.companion_institution}` : "",
        form.companion_position ? `CARGO: ${form.companion_position}` : "", form.companion_dietary_notes ? `ALIMENTACIÓN: ${form.companion_dietary_notes}` : "",
      ].filter(Boolean).join(" | ") : "";
      const notes = [form.notes, companionSummary].filter(Boolean).join("\n\n");
      const result = await registerAttendee({ ...form, attendance_status: "Confirmado", companion_name: form.has_companion === "Sí" ? form.companion_name : "", notes });
      router.push(`/inscripcion/confirmacion?code=${encodeURIComponent(result.registration_code)}&token=${encodeURIComponent(result.portal_token)}`);
    } catch (err) { setError(err instanceof Error ? err.message.toUpperCase() : "NO FUE POSIBLE ENVIAR LA INSCRIPCIÓN."); }
    finally { setBusy(false); }
  }

  function changeCompanion(value: string) {
    update("has_companion", value);
    if (value === "No") setForm((current: any) => ({ ...current, has_companion: "No", companion_name: "", companion_email: "", companion_phone: "", companion_rut: "", companion_institution: "", companion_position: "", companion_dietary_notes: "" }));
  }

  return <main className="guestExperience">
    <header className="guestHeader"><span className="guestSeal">II</span><div><strong>II GRAN GALA NACIONAL</strong><small>ALGUACILES DE CHILE · 2026</small></div></header>
    <section className="registrationShell">
      <aside className="registrationSteps">{steps.map((name, index) => <div className={index === step ? "active" : index < step ? "done" : ""} key={name}><span>PASO {index + 1}</span><strong>{name}</strong></div>)}</aside>
      <article className="registrationCard">
        <div className="registrationProgress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><p className="guestEyebrow">PASO {step + 1} DE {steps.length}</p><h1>{steps[step]}</h1>
        <div className="guestFormGrid">
          {step === 0 && <><label className="fullField">NOMBRE COMPLETO<input value={form.full_name} onChange={(e) => updateUpper("full_name", e.target.value)} /></label><label>CORREO<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label><label>CELULAR<input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label></>}
          {step === 1 && <label className="fullField">CÍRCULO<input value={form.circle_name} onChange={(e) => updateUpper("circle_name", e.target.value)} placeholder="EJ.: SERVICIOS DIPLOMÁTICOS" /></label>}
          {step === 2 && <><div className="fullField companionRegistration"><div className="companionHeading"><p className="guestEyebrow">ASISTENCIA</p><h2>CONFIRMADA</h2><p>AL COMPLETAR ESTA INSCRIPCIÓN, SU ASISTENCIA A LA GALA QUEDARÁ REGISTRADA COMO CONFIRMADA.</p></div></div><label className="fullField">¿ASISTIRÁ CON ACOMPAÑANTE?<select value={form.has_companion} onChange={(e) => changeCompanion(e.target.value)}><option value="No">NO</option><option value="Sí">SÍ</option></select></label>
            {form.has_companion === "Sí" && <section className="companionRegistration fullField"><div className="companionHeading"><p className="guestEyebrow">DATOS DEL ACOMPAÑANTE</p><h2>SEGUNDA PERSONA DE LA INSCRIPCIÓN</h2><p>COMPLETE SUS ANTECEDENTES PARA REGISTRARLO CORRECTAMENTE Y CONSIDERAR SU CUPO EN LA MESA.</p></div><div className="guestFormGrid companionGrid">
              <label className="fullField">NOMBRE COMPLETO DEL ACOMPAÑANTE *<input value={form.companion_name} onChange={(e) => updateUpper("companion_name", e.target.value)} /></label><label>RUT<input value={form.companion_rut} onChange={(e) => updateUpper("companion_rut", e.target.value)} /></label><label>CORREO<input type="email" value={form.companion_email} onChange={(e) => update("companion_email", e.target.value)} /></label><label>CELULAR<input value={form.companion_phone} onChange={(e) => update("companion_phone", e.target.value)} /></label><label>INSTITUCIÓN<input value={form.companion_institution} onChange={(e) => updateUpper("companion_institution", e.target.value)} /></label><label className="fullField">CARGO O RELACIÓN CON EL INVITADO<input value={form.companion_position} onChange={(e) => updateUpper("companion_position", e.target.value)} /></label><label className="fullField">RESTRICCIONES ALIMENTARIAS DEL ACOMPAÑANTE<textarea rows={3} value={form.companion_dietary_notes} onChange={(e) => updateUpper("companion_dietary_notes", e.target.value)} /></label>
            </div></section>}
          </>}
          {step === 3 && <label className="fullField">RESTRICCIONES ALIMENTARIAS DEL INVITADO PRINCIPAL<textarea rows={5} value={form.dietary_notes} onChange={(e) => updateUpper("dietary_notes", e.target.value)} /></label>}
          {step === 4 && <section className="fullField companionRegistration"><div className="companionHeading"><p className="guestEyebrow">ESTADO DE PAGO</p><h2>{form.payment_status === "Pagado" ? "PAGO REALIZADO" : "PAGO PENDIENTE"}</h2><p>LA CONDICIÓN INVITACIÓN SOLO PUEDE SER ASIGNADA POR LA ADMINISTRACIÓN.</p></div><div className="guestFormGrid"><label className="fullField">SELECCIONE SU SITUACIÓN<select value={form.payment_status} onChange={(e) => update("payment_status", e.target.value)}><option value="Pendiente">PENDIENTE</option><option value="Pagado">PAGADO POR TRANSFERENCIA</option></select></label>{form.payment_status === "Pendiente" && <div className="fullField"><p><strong>PAGAR AHORA</strong></p><p>PRÓXIMAMENTE PODRÁ PAGAR EN LÍNEA CON TARJETA O TRANSFERENCIA. EL SISTEMA ACTUALIZARÁ AUTOMÁTICAMENTE SU ESTADO A PAGADO.</p><button type="button" className="guestPrimary" disabled>PAGO EN LÍNEA · PRÓXIMAMENTE</button></div>}{form.payment_status === "Pagado" && <div className="fullField"><p><strong>COMPROBANTE DE TRANSFERENCIA</strong></p><p>PRÓXIMAMENTE SE HABILITARÁ LA CARGA SEGURA DEL COMPROBANTE PARA SU VALIDACIÓN.</p></div>}</div></section>}
          {step === 5 && <><label className="fullField">OBSERVACIONES<textarea rows={5} value={form.notes} onChange={(e) => updateUpper("notes", e.target.value)} /></label><div className="fullField companionRegistration"><div className="companionHeading"><p className="guestEyebrow">PRIVACIDAD Y DATOS PERSONALES</p><h2>CONSENTIMIENTO</h2><p>LOS DATOS SERÁN UTILIZADOS EXCLUSIVAMENTE PARA LA GESTIÓN Y ORGANIZACIÓN DE LA II GRAN GALA NACIONAL DE LOS ALGUACILES DE CHILE 2026.</p></div><label className="guestConsent"><input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} /><span>HE LEÍDO Y ACEPTO LA POLÍTICA DE PRIVACIDAD Y AUTORIZO EL TRATAMIENTO DE MIS DATOS PERSONALES PARA GESTIONAR MI INSCRIPCIÓN, PARTICIPACIÓN, PAGO, UBICACIÓN EN MESAS Y COMUNICACIONES RELACIONADAS CON LA II GRAN GALA NACIONAL DE LOS ALGUACILES DE CHILE 2026.</span></label></div></>}
        </div>
        {error && <div className="guestError">{error}</div>}<div className="guestActions"><button className="guestSecondary" disabled={step === 0 || busy} onClick={() => setStep((value) => value - 1)}>ANTERIOR</button><button className="guestPrimary" disabled={busy} onClick={next}>{busy ? "ENVIANDO…" : step === steps.length - 1 ? "ENVIAR INSCRIPCIÓN" : "CONTINUAR"}</button></div>
      </article>
    </section>
  </main>;
}
