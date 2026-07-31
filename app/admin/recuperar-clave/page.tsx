"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("admin@gala2026.cl");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function recover(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!supabaseConfigured || !supabase) {
      setError("Supabase no está conectado. En modo demostración usa admin@gala2026.cl y Gala2026!.");
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/admin/nueva-clave`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (resetError) {
      setError("No fue posible enviar el correo. Revisa la dirección y la configuración de Supabase.");
      return;
    }

    setMessage("Te enviamos un enlace para crear una nueva contraseña. Revisa también la carpeta de correo no deseado.");
  }

  return (
    <main className="adminLogin">
      <section className="loginCard passwordCard">
        <div className="loginSeal"><KeyRound /></div>
        <p className="adminEyebrow">Recuperación segura</p>
        <h1>Restablecer contraseña</h1>
        <p className="loginSubtitle">Ingresa el correo del administrador registrado en Supabase.</p>

        <form onSubmit={recover}>
          <label>
            Correo electrónico
            <span className="loginInput"><Mail size={18}/><input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></span>
          </label>
          {message && <p className="loginSuccess">{message}</p>}
          {error && <p className="loginError">{error}</p>}
          <button className="loginSubmit" disabled={loading}>{loading ? "Enviando..." : "Enviar enlace de recuperación"}</button>
        </form>

        <a className="forgotPasswordLink" href="/admin"><ArrowLeft size={16}/> Volver al acceso</a>
        <div className="passwordSecurity"><ShieldCheck size={18}/><span>El cambio se realiza mediante Supabase Auth.</span></div>
      </section>
    </main>
  );
}
