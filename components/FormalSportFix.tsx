"use client";

import { useEffect } from "react";

export default function FormalSportFix() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const applyFix = () => {
      const headings = Array.from(document.querySelectorAll("h3"));
      const heading = headings.find((item) => item.textContent?.trim().toLowerCase() === "tenida formal");
      if (!heading) return false;

      heading.textContent = "Tenida Formal Sport";

      const description = heading.nextElementSibling;
      if (description?.tagName === "P") {
        description.textContent = "Se solicita vestimenta Formal Sport, acorde al carácter solemne e institucional de la ceremonia.";
      }

      return true;
    };

    if (applyFix()) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (applyFix() || attempts >= 20) window.clearInterval(timer);
    }, 150);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
