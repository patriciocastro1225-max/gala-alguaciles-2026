"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function verifySession() {
      if (supabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) router.replace("/admin/dashboard");
      } else if (sessionStorage.getItem("gala-admin") === "1") {
        router.replace("/admin/dashboard");
      }
    }
    verifySession();
  }, [router]);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("No fue posible ingresar. Revisa el usuario y la contraseña.");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
      return;
    }

    setMessage("El acceso administrativo requiere conexión segura con Supabase. Intente nuevamente más tarde.");
    setLoading(false);
  }

  return (
    <main className="adminLogin">
      <section className="loginCard">
        <div className="loginSeal"><ShieldCheck /></div>
        <p className="adminEyebrow">Acceso institucional</p>
        <h1>Panel de Administración</h1>
        <p className="loginSubtitle">II Gran Gala Nacional de los Alguaciles de Chile 2026</p>

        <div className={supabaseConfigured ? "connectionBadge connected" : "connectionBadge demo"}>
          {supabaseConfigured ? "Supabase conectado" : "Modo demostración"}
        </div>

        <form onSubmit={login}>
          <label>
            Correo electrónico
            <span className="loginInput"><Mail size={18} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></span>
          </label>
          <label>
            Contraseña
            <span className="loginInput"><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </span>
          </label>
          {message && <p className="loginError">{message}</p>}
          <button className="loginSubmit" disabled={loading}>{loading ? "Ingresando..." : "Ingresar al panel"}</button>
        </form>

        {supabaseConfigured && (
          <a className="forgotPasswordLink" href="/admin/recuperar-clave">¿Olvidaste tu contraseña?</a>
        )}


      </section>
    </main>
  );
}
