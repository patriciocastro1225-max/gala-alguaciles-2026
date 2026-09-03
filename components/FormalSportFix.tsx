"use client";

import { useEffect } from "react";

export default function FormalSportFix() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const applyFixes = () => {
      let changed = false;

      const headings = Array.from(document.querySelectorAll("h3"));
      const dressHeading = headings.find((item) => item.textContent?.trim().toLowerCase() === "tenida formal");
      if (dressHeading) {
        dressHeading.textContent = "Tenida Formal Sport";
        const description = dressHeading.nextElementSibling;
        if (description?.tagName === "P") {
          description.textContent = "Se solicita vestimenta Formal Sport, acorde al carácter solemne e institucional de la ceremonia.";
        }
        changed = true;
      }

      const heroContent = document.querySelector(".heroContent");
      const heroActions = heroContent?.querySelector(".heroActions");
      if (heroContent && heroActions && !document.getElementById("limited-seats-notice")) {
        const notice = document.createElement("div");
        notice.id = "limited-seats-notice";
        notice.setAttribute("role", "note");
        notice.style.margin = "22px auto 18px";
        notice.style.padding = "13px 22px";
        notice.style.width = "fit-content";
        notice.style.maxWidth = "92%";
        notice.style.border = "1px solid rgba(212,175,55,.8)";
        notice.style.borderRadius = "999px";
        notice.style.background = "rgba(8,28,18,.88)";
        notice.style.boxShadow = "0 8px 30px rgba(0,0,0,.28)";
        notice.style.color = "#f4d978";
        notice.style.fontWeight = "800";
        notice.style.letterSpacing = ".08em";
        notice.style.textTransform = "uppercase";
        notice.style.textAlign = "center";
        notice.textContent = "⚠ Cupos limitados · Reserva con anticipación";
        heroContent.insertBefore(notice, heroActions);
        changed = true;
      }

      const reserveLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(`a[href="/inscripcion"]`));
      reserveLinks.forEach((link) => {
        if (link.textContent?.toLowerCase().includes("reserva pagando aquí")) {
          link.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent?.toLowerCase().includes("reserva pagando aquí")) {
              node.textContent = " Reserva ahora · Cupos limitados";
            }
          });
          changed = true;
        }
      });

      return changed;
    };

    applyFixes();

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      applyFixes();
      if (attempts >= 20) window.clearInterval(timer);
    }, 150);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
