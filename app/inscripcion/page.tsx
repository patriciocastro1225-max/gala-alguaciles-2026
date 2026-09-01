"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerAttendee, uploadPaymentReceipt } from "@/services/publicRegistration";
import { defaultPaymentConfig, getPublicPaymentConfig, type PaymentConfig } from "@/services/paymentConfig";

const steps = ["DATOS PERSONALES", "INFORMACIÓN INSTITUCIONAL", "PARTICIPACIÓN", "ALIMENTACIÓN", "PAGO", "CONFIRMACIÓN"];
const upper = (value: string) => value.toLocaleUpperCase("es-CL");
const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

const initialForm = {
  full_name: "", email: "", phone: "", circle_name: "", attendance_status: "Confirmado", has_companion: "No",
  companion_name: "", companion_email: "", companion_phone: "", companion_rut: "", companion_is_alguacil: "No", companion_circle_name: "", companion_position: "", companion_dietary_notes: "",
  dietary_notes: "", payment_status: "Pendiente", notes: "", consent: false,
};

async function notifyOrganizers(payload: Record<string, unknown>) {
  try {
    await fetch("/api/notifications/registration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  } catch {}
}

export default function RegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [paymentChoice, setPaymentChoice] = useState<"Tarjeta" | "Transferencia">("Tarjeta");
  const [form, setForm] = useState<any>(initialForm);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(defaultPaymentConfig);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const people = form.has_companion === "Sí" ? 2 : 1;
  const totalAmount = paymentConfig.dinner_price * people;

  useEffect(() => { getPublicPaymentConfig().then(setPaymentConfig).catch(() => setPaymentConfig(defaultPaymentConfig)); }, []);
  const update = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  const updateUpper = (key: string, value: string) => update(key, upper(value));

  function validateCurrentStep() {
    if (step === 0 && (!form.full_name.trim() || !form.email.trim() || !form.phone.trim())) { setError("COMPLETE NOMBRE, CORREO Y TELÉFONO."); return false; }
    if (step === 2 && form.has_companion === "Sí" && !form.companion_name.trim()) { setError("INGRESE EL NOMBRE COMPLETO DEL ACOMPAÑANTE."); return false; }
    if (step === 2 && form.has_companion === "Sí" && form.companion_is_alguacil === "Sí" && (!form.companion_circle_name.trim() || !form.companion_position.trim())) { setError("SI EL ACOMPAÑANTE ES ALGUACIL, INDIQUE SU CÍRCULO Y CARGO."); return false; }
    if (step === 4 && paymentChoice === "Transferencia" && !receiptFile) { setError("DEBE ADJUNTAR EL COMPROBANTE DE TRANSFERENCIA."); return false; }
    if (step === 4 && paymentChoice === "Tarjeta") { setError("EL PAGO CON TARJETA DE CRÉDITO ESTARÁ DISPONIBLE AL CONECTAR FLOW. PARA CONTINUAR AHORA, USE TRANSFERENCIA Y ADJUNTE SU COMPROBANTE."); return false; }
    if (step === 5 && !form.consent) { setError("DEBE ACEPTAR LA POLÍTICA DE PRIVACIDAD Y EL TRATAMIENTO DE DATOS."); return false; }
    setError(""); return true;
  }

  function chooseReceipt(file: File | null) {
    if (!file) { setReceiptFile(null); return; }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { setReceiptFile(null); setError("EL COMPROBANTE DEBE SER PDF, JPG, JPEG O PNG."); return; }
    if (file.size > 5 * 1024 * 1024) { setReceiptFile(null); setError("EL COMPROBANTE NO PUEDE SUPERAR 5 MB."); return; }
    setReceiptFile(file); setError("");
  }

  async function next() {
    if (!validateCurrentStep()) return;
    if (step < steps.length - 1) { setStep(v => v + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setBusy(true);
    try {
      const companionSummary = form.has_companion === "Sí" ? [
        `ACOMPAÑANTE: ${form.companion_name}`,
        form.companion_rut ? `RUT: ${form.companion_rut}` : "",
        form.companion_email ? `CORREO: ${form.companion_email}` : "",
        form.companion_phone ? `CELULAR: ${form.companion_phone}` : "",
        `¿ES ALGUACIL?: ${form.companion_is_alguacil.toUpperCase()}`,
        form.companion_is_alguacil === "Sí" ? `CÍRCULO: ${form.companion_circle_name}` : `CÍRCULO: ${form.circle_name} (ACOMPAÑANTE)`,
        form.companion_is_alguacil === "Sí" && form.companion_position ? `CARGO: ${form.companion_position}` : "",
        form.companion_dietary_notes ? `ALIMENTACIÓN: ${form.companion_dietary_notes}` : ""
      ].filter(Boolean).join(" | ") : "";
      const notes = [form.notes, companionSummary, `VALOR POR PERSONA: ${money(paymentConfig.dinner_price)}`, `TOTAL ESPERADO: ${money(totalAmount)}`].filter(Boolean).join("\n\n");
      let result = registrationResult;
      let newRegistration = false;
      if (!result) {
        result = await registerAttendee({ ...form, attendance_status: "Confirmado", payment_status: "Pendiente", companion_name: form.has_companion === "Sí" ? form.companion_name : "", notes });
        setRegistrationResult(result); newRegistration = true;
      }
      if (newRegistration) await notifyOrganizers({ type: "registration", registration_code: result.registration_code, portal_token: result.portal_token, full_name: form.full_name, email: form.email, phone: form.phone, circle_name: form.circle_name, companion_name: form.has_companion === "Sí" ? form.companion_name : "", people, amount: totalAmount, payment_method: paymentChoice === "Transferencia" ? "TRANSFERENCIA · COMPROBANTE PENDIENTE" : "TARJETA · PENDIENTE" });
      if (paymentChoice === "Transferencia" && receiptFile) {
        await uploadPaymentReceipt(receiptFile, result.attendee_id, result.portal_token, totalAmount);
        await notifyOrganizers({ type: "payment_receipt", registration_code: result.registration_code, portal_token: result.portal_token, full_name: form.full_name, email: form.email, phone: form.phone, circle_name: form.circle_name, companion_name: form.has_companion === "Sí" ? form.companion_name : "", people, amount: totalAmount, payment_method: "TRANSFERENCIA · COMPROBANTE PENDIENTE DE VALIDACIÓN" });
      }
      router.push(`/inscripcion/confirmacion?code=${encodeURIComponent(result.registration_code)}&token=${encodeURIComponent(result.portal_token)}&payment=revision`);
    } catch (err) { setError(err instanceof Error ? err.message.toUpperCase() : "NO FUE POSIBLE ENVIAR LA INSCRIPCIÓN."); }
    finally { setBusy(false); }
  }

  function changeCompanion(value: string) {
    update("has_companion", value);
    if (value === "No") setForm((c:any)=>({...c,has_companion:"No",companion_name:"",companion_email:"",companion_phone:"",companion_rut:"",companion_is_alguacil:"No",companion_circle_name:"",companion_position:"",companion_dietary_notes:""}));
  }
  function changeCompanionAlguacil(value:string) {
    setForm((c:any)=>({...c,companion_is_alguacil:value,companion_circle_name:value==="Sí"?c.companion_circle_name:"",companion_position:value==="Sí"?c.companion_position:""}));
  }

  return <main className="guestExperience"><header className="guestHeader"><span className="guestSeal">II</span><div><strong>II GRAN GALA NACIONAL</strong><small>ALGUACILES DE CHILE · 2026</small></div></header><section className="registrationShell"><aside className="registrationSteps">{steps.map((name,index)=><div className={index===step?"active":index<step?"done":""} key={name}><span>PASO {index+1}</span><strong>{name}</strong></div>)}</aside><article className="registrationCard"><div className="registrationProgress"><i style={{width:`${((step+1)/steps.length)*100}%`}}/></div><p className="guestEyebrow">PASO {step+1} DE {steps.length}</p><h1>{steps[step]}</h1><div className="guestFormGrid">
  {step===0&&<><label className="fullField">NOMBRE COMPLETO<input value={form.full_name} onChange={e=>updateUpper("full_name",e.target.value)}/></label><label>CORREO<input type="email" value={form.email} onChange={e=>update("email",e.target.value)}/></label><label>CELULAR<input value={form.phone} onChange={e=>update("phone",e.target.value)}/></label></>}
  {step===1&&<label className="fullField">CÍRCULO<input value={form.circle_name} onChange={e=>updateUpper("circle_name",e.target.value)} placeholder="EJ.: SERVICIOS DIPLOMÁTICOS"/></label>}
  {step===2&&<><div className="fullField companionRegistration"><div className="companionHeading"><p className="guestEyebrow">ASISTENCIA</p><h2>CONFIRMADA</h2><p>AL COMPLETAR ESTA INSCRIPCIÓN, SU ASISTENCIA A LA GALA QUEDARÁ REGISTRADA COMO CONFIRMADA.</p></div></div><label className="fullField">¿ASISTIRÁ CON ACOMPAÑANTE?<select value={form.has_companion} onChange={e=>changeCompanion(e.target.value)}><option value="No">NO</option><option value="Sí">SÍ</option></select></label>{form.has_companion==="Sí"&&<section className="companionRegistration fullField"><div className="companionHeading"><p className="guestEyebrow">DATOS DEL ACOMPAÑANTE</p><h2>SEGUNDA PERSONA DE LA INSCRIPCIÓN</h2></div><div className="guestFormGrid companionGrid"><label className="fullField">NOMBRE COMPLETO DEL ACOMPAÑANTE *<input value={form.companion_name} onChange={e=>updateUpper("companion_name",e.target.value)}/></label><label>RUT<input value={form.companion_rut} onChange={e=>updateUpper("companion_rut",e.target.value)}/></label><label>CORREO<input type="email" value={form.companion_email} onChange={e=>update("companion_email",e.target.value)}/></label><label>CELULAR<input value={form.companion_phone} onChange={e=>update("companion_phone",e.target.value)}/></label><label className="fullField">¿EL ACOMPAÑANTE ES ALGUACIL?<select value={form.companion_is_alguacil} onChange={e=>changeCompanionAlguacil(e.target.value)}><option value="No">NO</option><option value="Sí">SÍ</option></select></label>{form.companion_is_alguacil==="Sí"&&<><label>CÍRCULO DEL ACOMPAÑANTE *<input value={form.companion_circle_name} onChange={e=>updateUpper("companion_circle_name",e.target.value)} placeholder="SELECCIONE O ESCRIBA SU CÍRCULO"/></label><label>CARGO DEL ACOMPAÑANTE *<input value={form.companion_position} onChange={e=>updateUpper("companion_position",e.target.value)} placeholder="EJ.: PRESIDENTE, SECRETARIO, ALGUACIL"/></label></>}{form.companion_is_alguacil!=="Sí"&&<div className="fullField"><p>SE REGISTRARÁ COMO <strong>ACOMPAÑANTE</strong> ASOCIADO AL MISMO CÍRCULO DEL INVITADO PRINCIPAL: <strong>{form.circle_name || "CÍRCULO DEL INVITADO"}</strong>.</p></div>}<label className="fullField">RESTRICCIONES ALIMENTARIAS DEL ACOMPAÑANTE<textarea rows={3} value={form.companion_dietary_notes} onChange={e=>updateUpper("companion_dietary_notes",e.target.value)}/></label></div></section>}</>}
  {step===3&&<label className="fullField">RESTRICCIONES ALIMENTARIAS DEL INVITADO PRINCIPAL<textarea rows={5} value={form.dietary_notes} onChange={e=>updateUpper("dietary_notes",e.target.value)}/></label>}
  {step===4&&<section className="fullField companionRegistration"><div className="companionHeading"><p className="guestEyebrow">PAGO</p><h2>{money(totalAmount)}</h2><p>VALOR DE LA CENA: <strong>{money(paymentConfig.dinner_price)} POR PERSONA</strong>. {people===2 ? "INSCRIPCIÓN PARA 2 PERSONAS." : "INSCRIPCIÓN PARA 1 PERSONA."}</p><p>PARA COMPLETAR LA INSCRIPCIÓN DEBE REALIZAR EL PAGO AHORA. LA CONDICIÓN INVITACIÓN SOLO PUEDE SER ASIGNADA POR LA ADMINISTRACIÓN.</p></div><div className="guestFormGrid"><label className="fullField">FORMA DE PAGO<select value={paymentChoice} onChange={e=>{setPaymentChoice(e.target.value as "Tarjeta"|"Transferencia");setReceiptFile(null);setError("");}}><option value="Tarjeta">PAGAR AHORA CON TARJETA DE CRÉDITO</option><option value="Transferencia">YA PAGUÉ POR TRANSFERENCIA</option></select></label>{paymentChoice==="Tarjeta"&&<div className="fullField"><p><strong>PAGAR AHORA CON TARJETA DE CRÉDITO · {money(totalAmount)}</strong></p><p>ESTA OPCIÓN QUEDARÁ HABILITADA AL CONECTAR FLOW.</p><button type="button" className="guestPrimary" disabled>PAGAR {money(totalAmount)} CON TARJETA</button></div>}{paymentChoice==="Transferencia"&&<div className="fullField"><p><strong>DATOS PARA TRANSFERENCIA</strong></p><p><strong>MONTO A TRANSFERIR:</strong> {money(totalAmount)}</p>{paymentConfig.bank_account_holder&&<p><strong>TITULAR:</strong> {paymentConfig.bank_account_holder}</p>}{paymentConfig.bank_name&&<p><strong>BANCO:</strong> {paymentConfig.bank_name}</p>}{paymentConfig.bank_account_type&&<p><strong>TIPO DE CUENTA:</strong> {paymentConfig.bank_account_type}</p>}{paymentConfig.bank_account_number&&<p><strong>N° DE CUENTA:</strong> {paymentConfig.bank_account_number}</p>}{paymentConfig.bank_rut&&<p><strong>RUT:</strong> {paymentConfig.bank_rut}</p>}{paymentConfig.bank_email&&<p><strong>EMAIL:</strong> {paymentConfig.bank_email}</p>}<p><strong>SUBIR COMPROBANTE DE TRANSFERENCIA *</strong></p><p>FORMATOS PERMITIDOS: PDF, JPG, JPEG O PNG. TAMAÑO MÁXIMO: 5 MB.</p><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>chooseReceipt(e.target.files?.[0]??null)}/>{receiptFile&&<p><strong>ARCHIVO SELECCIONADO:</strong> {receiptFile.name.toUpperCase()}</p>}<p>EL PAGO QUEDARÁ COMO <strong>PENDIENTE DE VALIDACIÓN</strong> HASTA QUE EL COMITÉ REVISE EL COMPROBANTE.</p></div>}</div></section>}
  {step===5&&<><label className="fullField">OBSERVACIONES<textarea rows={5} value={form.notes} onChange={e=>updateUpper("notes",e.target.value)}/></label><div className="fullField companionRegistration"><div className="companionHeading"><p className="guestEyebrow">PRIVACIDAD Y DATOS PERSONALES</p><h2>CONSENTIMIENTO</h2><p>LOS DATOS SERÁN UTILIZADOS EXCLUSIVAMENTE PARA LA GESTIÓN Y ORGANIZACIÓN DE LA II GRAN GALA NACIONAL DE LOS ALGUACILES DE CHILE 2026.</p></div><label className="guestConsent"><input type="checkbox" checked={form.consent} onChange={e=>update("consent",e.target.checked)}/><span>HE LEÍDO Y ACEPTO LA POLÍTICA DE PRIVACIDAD Y AUTORIZO EL TRATAMIENTO DE MIS DATOS PERSONALES PARA GESTIONAR MI INSCRIPCIÓN, PARTICIPACIÓN, PAGO, UBICACIÓN EN MESAS Y COMUNICACIONES RELACIONADAS CON LA II GRAN GALA NACIONAL DE LOS ALGUACILES DE CHILE 2026.</span></label></div></>}
</div>{error&&<div className="guestError">{error}</div>}<div className="guestActions"><button className="guestSecondary" disabled={step===0||busy} onClick={()=>setStep(v=>v-1)}>ANTERIOR</button><button className="guestPrimary" disabled={busy} onClick={next}>{busy?"ENVIANDO…":step===steps.length-1?"ENVIAR INSCRIPCIÓN":"CONTINUAR"}</button></div></article></section></main>;
}
