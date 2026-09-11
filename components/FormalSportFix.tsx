"use client";

import { useEffect } from "react";
import { getPublicPaymentConfig } from "@/services/paymentConfig";

const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export default function FormalSportFix() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    let dinnerPrice = 45000;

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

      if (heroContent && heroActions && !document.getElementById("gala-price-panel")) {
        const panel = document.createElement("div");
        panel.id = "gala-price-panel";
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-label", "Valores de la Gran Gala");
        panel.style.margin = "0 auto 20px";
        panel.style.width = "min(720px, 94%)";
        panel.style.display = "grid";
        panel.style.gridTemplateColumns = "repeat(auto-fit, minmax(220px, 1fr))";
        panel.style.gap = "1px";
        panel.style.overflow = "hidden";
        panel.style.border = "1px solid rgba(200,161,77,.55)";
        panel.style.borderRadius = "18px";
        panel.style.background = "rgba(200,161,77,.35)";
        panel.style.boxShadow = "0 16px 45px rgba(0,0,0,.3)";
        panel.style.backdropFilter = "blur(14px)";

        const person = document.createElement("div");
        person.style.padding = "18px 20px";
        person.style.background = "rgba(5,18,12,.92)";
        person.innerHTML = `<span style="display:block;color:#c8a14d;text-transform:uppercase;letter-spacing:.16em;font-size:.7rem;font-weight:700">Valor cena Gala</span><strong style="display:block;color:#ead59a;font-family:Cinzel,serif;font-size:1.65rem;margin-top:4px">${formatCLP(dinnerPrice)}</strong><small style="color:#c9cfcb">por persona</small>`;

        const table = document.createElement("div");
        table.style.padding = "18px 20px";
        table.style.background = "rgba(5,18,12,.92)";
        table.innerHTML = `<span style="display:block;color:#c8a14d;text-transform:uppercase;letter-spacing:.16em;font-size:.7rem;font-weight:700">Mesa completa</span><strong style="display:block;color:#ead59a;font-family:Cinzel,serif;font-size:1.65rem;margin-top:4px">${formatCLP(dinnerPrice * 10)}</strong><small style="color:#c9cfcb">10 personas · ideal para Círculos y grupos</small>`;

        panel.append(person, table);
        heroContent.insertBefore(panel, heroActions);
        changed = true;
      } else {
        const panel = document.getElementById("gala-price-panel");
        if (panel) {
          const strongs = panel.querySelectorAll("strong");
          if (strongs[0]) strongs[0].textContent = formatCLP(dinnerPrice);
          if (strongs[1]) strongs[1].textContent = formatCLP(dinnerPrice * 10);
        }
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

    getPublicPaymentConfig()
      .then((config) => {
        dinnerPrice = Number(config.dinner_price) || 45000;
        applyFixes();
      })
      .catch(() => {
        dinnerPrice = 45000;
        applyFixes();
      });

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
