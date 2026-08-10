"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Cloud, Database, KeyRound, ShieldCheck, XCircle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { supabaseConfigured } from "@/lib/supabase";
import { defaultPaymentConfig, getAdminPaymentConfig, saveAdminPaymentConfig, type PaymentConfig } from "@/services/paymentConfig";

export default function ConfigurationPage() {
  const [config, setConfig] = useState<PaymentConfig>(defaultPaymentConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) return;
    getAdminPaymentConfig().then(setConfig).catch((e) => setMessage(e instanceof Error ? e.message : "NO FUE POSIBLE CARGAR LA CONFIGURACIÓN."));
  }, []);

  const checks = [
    { name: "Variables de entorno", ok: supabaseConfigured, detail: supabaseConfigured ? "URL y clave pública detectadas." : "Falta configurar .env.local o Netlify." },
    { name: "Autenticación", ok: supabaseConfigured, detail: supabaseConfigured ? "Inicio de sesión real habilitado." : "Se mantiene el acceso demostrativo." },
    { name: "Base de datos", ok: supabaseConfigured, detail: supabaseConfigured ? "Cliente preparado para consultar Supabase." : "Ejecuta supabase/schema.sql." },
    { name: "Seguridad RLS", ok: true, detail: "El sistema utiliza políticas RLS y funciones controladas." },
  ];

  const update = (key: keyof PaymentConfig, value: string | number) => setConfig((c) => ({ ...c, [key]: value }));

  async function save() {
    setSaving(true); setMessage("");
    try {
      await saveAdminPaymentConfig(config);
      setMessage("CONFIGURACIÓN DE PAGOS GUARDADA CORRECTAMENTE.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message.toUpperCase() : "NO FUE POSIBLE GUARDAR.");
    } finally { setSaving(false); }
  }

  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading"><div><p className="adminEyebrow">Configuración</p><h1>Evento y pagos</h1><p>Administra el valor de la cena y los datos bancarios que verá el invitado al pagar.</p></div></section>

        <section className="adminCard" style={{marginBottom:24}}>
          <div className="pageHeading"><div><p className="adminEyebrow">Valores editables</p><h2>Pago de la Gala</h2><p>Los cambios se reflejarán en el formulario de inscripción y en la información pública del evento.</p></div></div>
          <div className="formGrid">
            <label>VALOR POR PERSONA ($)<input type="number" min="1" value={config.dinner_price} onChange={(e)=>update("dinner_price", Number(e.target.value))}/></label>
            <label>TITULAR DE LA CUENTA<input value={config.bank_account_holder} onChange={(e)=>update("bank_account_holder", e.target.value.toUpperCase())}/></label>
            <label>BANCO<input value={config.bank_name} onChange={(e)=>update("bank_name", e.target.value.toUpperCase())}/></label>
            <label>TIPO DE CUENTA<input value={config.bank_account_type} onChange={(e)=>update("bank_account_type", e.target.value.toUpperCase())} placeholder="CUENTA CORRIENTE"/></label>
            <label>NÚMERO DE CUENTA<input value={config.bank_account_number} onChange={(e)=>update("bank_account_number", e.target.value)}/></label>
            <label>RUT<input value={config.bank_rut} onChange={(e)=>update("bank_rut", e.target.value.toUpperCase())}/></label>
            <label className="fullField">EMAIL PARA TRANSFERENCIAS<input type="email" value={config.bank_email} onChange={(e)=>update("bank_email", e.target.value)}/></label>
          </div>
          {message && <div className="guestNotice" style={{marginTop:16}}>{message}</div>}
          <div className="guestActions" style={{marginTop:18}}><button className="guestPrimary" disabled={saving} onClick={save}>{saving ? "GUARDANDO…" : "GUARDAR CONFIGURACIÓN"}</button></div>
        </section>

        <section className={supabaseConfigured ? "supabaseHero connected" : "supabaseHero demo"}>
          <Database size={48} /><div><span>{supabaseConfigured ? "PLATAFORMA CONECTADA" : "CONFIGURACIÓN PENDIENTE"}</span><h2>{supabaseConfigured ? "Supabase está activo" : "El sistema continúa en modo demostración"}</h2><p>{supabaseConfigured ? "El login y los datos persistentes están activos." : "Agrega las variables de entorno y ejecuta el esquema SQL para activar la base real."}</p></div>
        </section>

        <section className="connectionChecklist">{checks.map((check) => <article key={check.name}>{check.ok ? <CheckCircle2 className="ok" /> : <XCircle className="pending" />}<div><strong>{check.name}</strong><p>{check.detail}</p></div></article>)}</section>

        <section className="securityNotes">
          <article><ShieldCheck /><div><strong>Row Level Security</strong><p>Las tablas sensibles no quedan abiertas al público.</p></div></article>
          <article><KeyRound /><div><strong>Sesión autenticada</strong><p>Solo administración puede modificar estos datos.</p></div></article>
          <article><Cloud /><div><strong>Datos persistentes</strong><p>Los cambios quedan almacenados en Supabase.</p></div></article>
        </section>
      </main>
    </AdminShell>
  );
}
