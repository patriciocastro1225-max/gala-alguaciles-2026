"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAttendee } from "@/services/publicRegistration";

const steps = [
  "Datos personales",
  "Información institucional",
  "Participación",
  "Alimentación",
  "Pago",
  "Confirmación",
];

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  circle_name: "",
  attendance_status: "Pendiente",
  has_companion: "No",
  companion_name: "",
  companion_email: "",
  companion_phone: "",
  companion_rut: "",
  companion_institution: "",
  companion_position: "",
  companion_dietary_notes: "",
  dietary_notes: "",
  payment_status: "Pendiente",
  notes: "",
  consent: false,
};

export default function RegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<any>(initialForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key: string, value: any) =>
    setForm((current: any) => ({ ...current, [key]: value }));

  function validateCurrentStep() {
    if (step === 0 && (!form.full_name.trim() || !form.email.trim() || !form.phone.trim())) {
      setError("Complete nombre, correo y teléfono.");
      return false;
    }

    if (step === 2 && form.has_companion === "Sí") {
      if (!form.companion_name.trim()) {
        setError("Ingrese el nombre completo del acompañante.");
        return false;
      }
    }

    if (step === 5 && !form.consent) {
      setError("Debe aceptar el uso de datos.");
      return false;
    }

    setError("");
    return true;
  }

  async function next() {
    if (!validateCurrentStep()) return;

    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setBusy(true);
    try {
      const companionSummary = form.has_companion === "Sí"
        ? [
            `Acompañante: ${form.companion_name}`,
            form.companion_rut ? `RUT: ${form.companion_rut}` : "",
            form.companion_email ? `Correo: ${form.companion_email}` : "",
            form.companion_phone ? `Celular: ${form.companion_phone}` : "",
            form.companion_institution ? `Institución: ${form.companion_institution}` : "",
            form.companion_position ? `Cargo: ${form.companion_position}` : "",
            form.companion_dietary_notes ? `Alimentación: ${form.companion_dietary_notes}` : "",
          ].filter(Boolean).join(" | ")
        : "";

      const notes = [form.notes, companionSummary].filter(Boolean).join("\n\n");
      const result = await registerAttendee({
        ...form,
        companion_name: form.has_companion === "Sí" ? form.companion_name : "",
        notes,
      });

      router.push(
        `/inscripcion/confirmacion?code=${encodeURIComponent(result.registration_code)}&token=${encodeURIComponent(result.portal_token)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible enviar la inscripción.");
    } finally {
      setBusy(false);
    }
  }

  function changeCompanion(value: string) {
    update("has_companion", value);
    if (value === "No") {
      setForm((current: any) => ({
        ...current,
        has_companion: "No",
        companion_name: "",
        companion_email: "",
        companion_phone: "",
        companion_rut: "",
        companion_institution: "",
        companion_position: "",
        companion_dietary_notes: "",
      }));
    }
  }

  return (
    <main className="guestExperience">
      <header className="guestHeader">
        <span className="guestSeal">II</span>
        <div>
          <strong>II Gran Gala Nacional</strong>
          <small>Alguaciles de Chile · 2026</small>
        </div>
      </header>

      <section className="registrationShell">
        <aside className="registrationSteps">
          {steps.map((name, index) => (
            <div className={index === step ? "active" : index < step ? "done" : ""} key={name}>
              <span>Paso {index + 1}</span>
              <strong>{name}</strong>
            </div>
          ))}
        </aside>

        <article className="registrationCard">
          <div className="registrationProgress">
            <i style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <p className="guestEyebrow">Paso {step + 1} de {steps.length}</p>
          <h1>{steps[step]}</h1>

          <div className="guestFormGrid">
            {step === 0 && (
              <>
                <label className="fullField">Nombre completo
                  <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
                </label>
                <label>Correo
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </label>
                <label>Celular
                  <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </label>
              </>
            )}

            {step === 1 && (
              <label className="fullField">Círculo
                <input value={form.circle_name} onChange={(e) => update("circle_name", e.target.value)} placeholder="Ej.: Servicios Diplomáticos" />
              </label>
            )}

            {step === 2 && (
              <>
                <label>Confirmación
                  <select value={form.attendance_status} onChange={(e) => update("attendance_status", e.target.value)}>
                    <option>Confirmado</option>
                    <option>Pendiente</option>
                    <option>Cancelado</option>
                  </select>
                </label>

                <label>¿Asistirá con acompañante?
                  <select value={form.has_companion} onChange={(e) => changeCompanion(e.target.value)}>
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </label>

                {form.has_companion === "Sí" && (
                  <section className="companionRegistration fullField">
                    <div className="companionHeading">
                      <p className="guestEyebrow">Datos del acompañante</p>
                      <h2>Segunda persona de la inscripción</h2>
                      <p>Complete sus antecedentes para registrarlo correctamente y considerar su cupo en la mesa.</p>
                    </div>

                    <div className="guestFormGrid companionGrid">
                      <label className="fullField">Nombre completo del acompañante *
                        <input value={form.companion_name} onChange={(e) => update("companion_name", e.target.value)} />
                      </label>
                      <label>RUT
                        <input value={form.companion_rut} onChange={(e) => update("companion_rut", e.target.value)} />
                      </label>
                      <label>Correo
                        <input type="email" value={form.companion_email} onChange={(e) => update("companion_email", e.target.value)} />
                      </label>
                      <label>Celular
                        <input value={form.companion_phone} onChange={(e) => update("companion_phone", e.target.value)} />
                      </label>
                      <label>Institución
                        <input value={form.companion_institution} onChange={(e) => update("companion_institution", e.target.value)} />
                      </label>
                      <label className="fullField">Cargo o relación con el invitado
                        <input value={form.companion_position} onChange={(e) => update("companion_position", e.target.value)} />
                      </label>
                      <label className="fullField">Restricciones alimentarias del acompañante
                        <textarea rows={3} value={form.companion_dietary_notes} onChange={(e) => update("companion_dietary_notes", e.target.value)} />
                      </label>
                    </div>
                  </section>
                )}
              </>
            )}

            {step === 3 && (
              <label className="fullField">Restricciones alimentarias del invitado principal
                <textarea rows={5} value={form.dietary_notes} onChange={(e) => update("dietary_notes", e.target.value)} />
              </label>
            )}

            {step === 4 && (
              <label>Estado de pago
                <select value={form.payment_status} onChange={(e) => update("payment_status", e.target.value)}>
                  <option>Pendiente</option>
                  <option>Pagado</option>
                  <option>Invitación</option>
                </select>
              </label>
            )}

            {step === 5 && (
              <>
                <label className="fullField">Observaciones
                  <textarea rows={5} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                </label>
                <label className="fullField guestConsent">
                  <input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} />
                  <span>Autorizo el uso de estos datos para la organización de la Gala 2026.</span>
                </label>
              </>
            )}
          </div>

          {error && <div className="guestError">{error}</div>}

          <div className="guestActions">
            <button className="guestSecondary" disabled={step === 0 || busy} onClick={() => setStep((value) => value - 1)}>Anterior</button>
            <button className="guestPrimary" disabled={busy} onClick={next}>
              {busy ? "Enviando…" : step === steps.length - 1 ? "Enviar inscripción" : "Continuar"}
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
