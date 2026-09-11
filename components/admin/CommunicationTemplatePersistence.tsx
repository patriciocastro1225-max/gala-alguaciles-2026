"use client";

import { useEffect } from "react";

const STORAGE_KEY = "gala2026-email-templates";

type SavedTemplate = { subject: string; body: string };
type SavedTemplates = Record<string, SavedTemplate>;

function readSaved(): SavedTemplates {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as SavedTemplates;
  } catch {
    return {};
  }
}

function setReactValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

export default function CommunicationTemplatePersistence() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let attempts = 0;

    const timer = window.setInterval(() => {
      attempts += 1;
      const composer = document.querySelector(".composer26");
      if (!composer) {
        if (attempts > 40) window.clearInterval(timer);
        return;
      }

      window.clearInterval(timer);

      const select = composer.querySelector("select") as HTMLSelectElement | null;
      const subjectInput = composer.querySelector('input') as HTMLInputElement | null;
      const bodyInput = composer.querySelector('textarea') as HTMLTextAreaElement | null;
      if (!select || !subjectInput || !bodyInput) return;

      const restore = () => {
        const saved = readSaved()[select.value];
        if (!saved) return;
        window.setTimeout(() => {
          setReactValue(subjectInput, saved.subject);
          setReactValue(bodyInput, saved.body);
        }, 0);
      };

      const save = () => {
        const all = readSaved();
        all[select.value] = {
          subject: subjectInput.value,
          body: bodyInput.value,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      };

      const onSelect = () => window.setTimeout(restore, 10);
      subjectInput.addEventListener("input", save);
      bodyInput.addEventListener("input", save);
      select.addEventListener("change", onSelect);
      restore();

      cleanup = () => {
        subjectInput.removeEventListener("input", save);
        bodyInput.removeEventListener("input", save);
        select.removeEventListener("change", onSelect);
      };
    }, 100);

    return () => {
      window.clearInterval(timer);
      cleanup?.();
    };
  }, []);

  return null;
}
