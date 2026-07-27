"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Bell, CircleDollarSign, ClipboardCheck, LayoutDashboard,
  LogOut, Menu, ShieldCheck, Star, TableProperties, UsersRound, X
} from "lucide-react";

const items = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", enabled: true },
  { label: "Asistentes", icon: UsersRound, href: "/admin/asistentes", enabled: true },
  { label: "Mesas", icon: TableProperties, href: "/admin/mesas", enabled: true },
  { label: "Invitados", icon: Star, href: "/admin/invitados", enabled: true },
  { label: "Círculos", icon: ShieldCheck, href: "/admin/circulos", enabled: true },
  { label: "Pagos", icon: CircleDollarSign, href: "/admin/pagos", enabled: false },
  { label: "Check-in", icon: ClipboardCheck, href: "/admin/checkin", enabled: false },
  { label: "Estadísticas", icon: BarChart3, href: "/admin/estadisticas", enabled: false },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("gala-admin") !== "1") router.replace("/admin");
  }, [router]);

  function logout() {
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
