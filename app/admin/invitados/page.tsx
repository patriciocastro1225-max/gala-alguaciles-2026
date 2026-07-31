"use client";

import { Landmark } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

export default function GuestsPage() {
  return (
    <AdminShell>
      <main className="adminPage">
        <section className="pageHeading">
          <div>
            <p className="adminEyebrow">Información institucional</p>
            <h1>Invitados especiales</h1>
          </div>
        </section>

        <section className="institutionalGuestAdmin">
          <Landmark size={48} aria-hidden="true" />
          <h2>Invitados de renombre institucional y nacional</h2>
          <p>
            La II Gran Gala Nacional de los Alguaciles de Chile 2026 contará
            con la distinguida presencia de invitados de renombre institucional
            y nacional.
          </p>
        </section>
      </main>
    </AdminShell>
  );
}
