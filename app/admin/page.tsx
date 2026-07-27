"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@galaalguaciles.cl");
  const [password, setPassword] = useState("Gala2026!");
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

    if (email === "admin@galaalguaciles.cl" && password === "Gala2026!") {
      sessionStorage.setItem("gala-admin", "1");
      router.push("/admin/dashboard");
    } else {
      setMessage("Credenciales de demostración incorrectas.");
    }
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

        {!supabaseConfigured && (
          <p className="demoCredentials">
            Demo: admin@galaalguaciles.cl · Gala2026!
          </p>
        )}
      </section>
    </main>
  );
}
