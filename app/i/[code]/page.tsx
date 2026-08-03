import { Suspense } from "react";
import GuestPortalClient from "./GuestPortalClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="guestExperience guestCenter">
          <article className="guestConfirmationCard">
            <p>Cargando portal…</p>
          </article>
        </main>
      }
    >
      <GuestPortalClient />
    </Suspense>
  );
}
