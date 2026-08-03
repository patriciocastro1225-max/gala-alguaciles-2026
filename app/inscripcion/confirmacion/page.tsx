import { Suspense } from "react";
import ConfirmationClient from "./ConfirmationClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="guestExperience guestCenter">
          <article className="guestConfirmationCard">
            <p>Cargando confirmación…</p>
          </article>
        </main>
      }
    >
      <ConfirmationClient />
    </Suspense>
  );
}
