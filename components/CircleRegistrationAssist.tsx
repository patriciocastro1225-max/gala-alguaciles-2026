"use client";

import { useEffect } from "react";
import { listPublicCircles } from "@/services/circles";

export default function CircleRegistrationAssist() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/inscripcion")) return;

    let active = true;
    let names: string[] = [];
    let observer: MutationObserver | null = null;

    const attach = () => {
      const labels = Array.from(document.querySelectorAll("label"));
      const circleLabel = labels.find((label) =>
        label.textContent?.trim().toLocaleUpperCase("es-CL").startsWith("CÍRCULO")
      );
      const input = circleLabel?.querySelector("input") as HTMLInputElement | null;
      if (!input) return false;

      // Evita volver a modificar el mismo input en cada mutación del DOM.
      if (input.dataset.circleAssist === "1") return true;

      let datalist = document.getElementById("gala-circle-options") as HTMLDataListElement | null;
      if (!datalist) {
        datalist = document.createElement("datalist");
        datalist.id = "gala-circle-options";

        for (const name of names) {
          const option = document.createElement("option");
          option.value = name;
          datalist.appendChild(option);
        }

        document.body.appendChild(datalist);
      }

      input.dataset.circleAssist = "1";
      input.setAttribute("list", datalist.id);
      input.setAttribute("autocomplete", "off");
      input.placeholder = "ESCRIBA PARA BUSCAR SU CÍRCULO O UNIDAD";

      if (!circleLabel?.querySelector("[data-circle-help]")) {
        const help = document.createElement("small");
        help.dataset.circleHelp = "1";
        help.textContent = "SELECCIONE UNA OPCIÓN DE LA LISTA. SI NO APARECE, PUEDE ESCRIBIR EL NOMBRE COMPLETO.";
        help.style.display = "block";
        help.style.marginTop = "8px";
        help.style.opacity = "0.72";
        circleLabel?.appendChild(help);
      }

      // Una vez encontrado y preparado el campo, ya no necesitamos observar el DOM.
      observer?.disconnect();
      return true;
    };

    listPublicCircles()
      .then((circles) => {
        if (!active) return;
        names = Array.from(new Set(circles.map((circle) => circle.name).filter(Boolean))).sort((a, b) =>
          a.localeCompare(b, "es", { sensitivity: "base" })
        );
        attach();
      })
      .catch(() => {
        names = [];
        attach();
      });

    observer = new MutationObserver(() => {
      attach();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    attach();

    return () => {
      active = false;
      observer?.disconnect();
    };
  }, []);

  return null;
}
