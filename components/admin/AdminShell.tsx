"use client";

import { ReactNode, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Bell, CircleDollarSign, ClipboardCheck, CreditCard, FileText, Gauge, LayoutDashboard, LayoutGrid, Radio,
  LogOut, Menu, ShieldCheck, Star, TableProperties, UserRoundCheck, UsersRound, WalletCards, X
} from "lucide-react";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", enabled: true },
  { label: "Día del evento", icon: Radio, href: "/admin/evento", enabled: true },
  { label: "Operación evento", icon: Gauge, href: "/admin/operacion", enabled: true },
  { label: "Control en vivo", icon: Radio, href: "/admin/control-evento", enabled: true },
  { label: "Asistentes", icon: UsersRound, href: "/admin/asistentes", enabled: true },
  { label: "Gestión invitados", icon: UserRoundCheck, href: "/admin/gestion-invitados", enabled: true },
  { label: "Mesas", icon: TableProperties, href: "/admin/mesas", enabled: true },
  { label: "Plano del salón", icon: LayoutGrid, href: "/admin/plano", enabled: true },
  { label: "Invitados", icon: Star, href: "/admin/invitados", enabled: true },
  { label: "Círculos", icon: ShieldCheck, href: "/admin/circulos", enabled: true },
  { label: "Pagos", icon: CircleDollarSign, href: "/admin/pagos", enabled: true },
  { label: "Finanzas", icon: WalletCards, href: "/admin/finanzas", enabled: true },
  { label: "Check-in", icon: ClipboardCheck, href: "/admin/checkin", enabled: true },
  { label: "Correos", icon: Bell, href: "/admin/correos", enabled: true },
  { label: "QR", icon: ShieldCheck, href: "/admin/qr", enabled: true },
  { label: "Credenciales", icon: CreditCard, href: "/admin/credenciales", enabled: true },
  { label: "Estadísticas", icon: BarChart3, href: "/admin/estadisticas", enabled: true },
  { label: "Listado por mesa", icon: FileText, href: "/admin/reporte-mesas", enabled: true },
  { label: "Informe financiero", icon: FileText, href: "/admin/reporte-financiero", enabled: true },
  { label: "Configuración", icon: ShieldCheck, href: "/admin/configuracion", enabled: true },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function verify() {
      if (supabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) router.replace("/admin");
        return;
      }
      if (sessionStorage.getItem("gala-admin") !== "1") router.replace("/admin");
    }
    verify();
  }, [router]);

  async function logout() {
    if (supabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem("gala-admin");
    router.push("/admin");
  }

  return (
    <div className="adminApp">
      <aside className={open ? "adminSidebar open" : "adminSidebar"}>
        <div className="sidebarBrand">
          <span className="sidebarSeal">II</span>
          <span>Gala Nacional<small>Panel 2026</small></span>
          <button onClick={() => setOpen(false)} aria-label="Cerrar menú"><X /></button>
        </div>

        <nav>
          {items.map(({ label, icon: Icon, href, enabled }) => {
            const active = pathname === href;
            return (
              <button
                key={label}
                className={active ? "sidebarItem active" : "sidebarItem"}
                onClick={() => {
                  if (enabled) {
                    router.push(href);
                    setOpen(false);
                  }
                }}
                title={enabled ? label : `${label}: próximo sprint`}
              >
                <Icon size={20} />
                <span>{label}</span>
                {!enabled && <small>Próximo</small>}
              </button>
            );
          })}
        </nav>

        <button className="sidebarItem logout" onClick={logout}>
          <LogOut size={20} /> Cerrar sesión
        </button>
      </aside>

      {open && <button className="backdrop" onClick={() => setOpen(false)} aria-label="Cerrar menú" />}

      <section className="adminWorkspace">
        <header className="adminTopbar">
          <button className="mobileMenu" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu /></button>
          <div>
            <span>Centro de control</span>
            <strong>II Gran Gala Nacional 2026</strong>
          </div>
          <button className="iconButton" aria-label="Notificaciones"><Bell size={20} /><i /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
