"use client";

import { CheckCircle2, Cloud, Database, KeyRound, ShieldCheck, XCircle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { supabaseConfigured } from "@/lib/supabase";

export default function ConfigurationPage() {
  const checks = [
    { name: "Variables de entorno", ok: supabaseConfigured, detail: supabaseConfigured ? "URL y clave pública detectadas." : "Falta configurar .env.local o Netlify." },
    { name: "Autenticación", ok: supabaseConfigured, detail: supabaseConfigured ? "Inicio de sesión real habilitado." : "Se mantiene el acceso demostrativo." },
    { name: "Base de datos", ok: supabaseConfigured, detail: supabaseConfigured ? "Cliente preparado para consultar Supabase." : "Ejecuta supabase/schema.sql." },
    { name: "Seguridad RLS", ok: true, detail: "El script incluye políticas para usuarios autenticados." },
  ];

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Infraestructura</p>
            <h1>Conexión Supabase</h1>
            <p>Revisa el estado técnico de la plataforma y la base de datos.</p>
          </div>
        </section>

        <section className={supabaseConfigured ? "supabaseHero connected" : "supabaseHero demo"}>
          <Database size={48} />
          <div>
            <span>{supabaseConfigured ? "PLATAFORMA CONECTADA" : "CONFIGURACIÓN PENDIENTE"}</span>
            <h2>{supabaseConfigured ? "Supabase está activo" : "El sistema continúa en modo demostración"}</h2>
            <p>{supabaseConfigured ? "El login ya utiliza autenticación segura." : "Agrega las variables de entorno y ejecuta el esquema SQL para activar la base real."}</p>
          </div>
        </section>

        <section className="connectionChecklist">
          {checks.map((check) => (
            <article key={check.name}>
              {check.ok ? <CheckCircle2 className="ok" /> : <XCircle className="pending" />}
              <div><strong>{check.name}</strong><p>{check.detail}</p></div>
            </article>
          ))}
        </section>

        <section className="setupSteps">
          <h3>Pasos para activar la base real</h3>
          <ol>
            <li><span>1</span><div><strong>Crear proyecto en Supabase</strong><p>Utiliza una contraseña segura y selecciona una región cercana.</p></div></li>
            <li><span>2</span><div><strong>Ejecutar schema.sql</strong><p>Abre SQL Editor, pega el archivo y presiona Run.</p></div></li>
            <li><span>3</span><div><strong>Crear usuario administrador</strong><p>Authentication → Users → Add user.</p></div></li>
            <li><span>4</span><div><strong>Agregar variables a Netlify</strong><p>NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.</p></div></li>
            <li><span>5</span><div><strong>Volver a desplegar</strong><p>Netlify reconstruirá el sitio con la conexión activa.</p></div></li>
          </ol>
        </section>

        <section className="securityNotes">
          <article><ShieldCheck /><div><strong>Row Level Security</strong><p>Las tablas no quedan abiertas al público.</p></div></article>
          <article><KeyRound /><div><strong>Sesión autenticada</strong><p>El panel exige un usuario creado en Supabase.</p></div></article>
          <article><Cloud /><div><strong>Datos persistentes</strong><p>Los registros permanecerán guardados entre sesiones.</p></div></article>
        </section>
      </main>
    </AdminShell>
  );
}
