"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function NewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!supabaseConfigured || !supabase) return;
      const { data } = await supabase.auth.getSession();
      setReady(Boolean(data.session));
    }
    verify();
  }, []);

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    setMessage(""); setError("");
    if (password.length < 10) { setError("La contraseña debe tener al menos 10 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    if (!supabaseConfigured || !supabase) { setError("Supabase no está conectado."); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError("El enlace venció o no fue posible actualizar la contraseña. Solicita uno nuevo."); return; }
    setMessage("Contraseña actualizada correctamente. Serás dirigido al panel.");
    window.setTimeout(() => router.replace("/admin/dashboard"), 1400);
  }

  return (
    <main className="adminLogin">
      <section className="loginCard passwordCard">
        <div className="loginSeal"><KeyRound /></div>
        <p className="adminEyebrow">Seguridad de acceso</p>
        <h1>Crear nueva contraseña</h1>
        <p className="loginSubtitle">Utiliza una contraseña exclusiva para el panel de la Gala.</p>

        {!ready && <p className="loginError">Abre esta página desde el enlace recibido por correo. Si el enlace venció, solicita uno nuevo.</p>}

        <form onSubmit={updatePassword}>
          <label>Contraseña nueva
            <span className="loginInput"><KeyRound size={18}/><input minLength={10} required type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}/>
            <button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
          </label>
          <label>Repetir contraseña
            <span className="loginInput"><ShieldCheck size={18}/><input minLength={10} required type={show ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}/></span>
          </label>
          {message && <p className="loginSuccess">{message}</p>}
          {error && <p className="loginError">{error}</p>}
          <button className="loginSubmit" disabled={loading || !ready}>{loading ? "Actualizando..." : "Guardar nueva contraseña"}</button>
        </form>
      </section>
    </main>
  );
}
