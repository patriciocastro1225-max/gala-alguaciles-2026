"use client";

import { useEffect, useState } from "react";

export default function Intro() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("gala-intro-seen");
    if (seen) setVisible(false);
  }, []);

  function closeIntro() {
    setLeaving(true);
    sessionStorage.setItem("gala-intro-seen", "1");
    window.setTimeout(() => setVisible(false), 800);
  }

  if (!visible) return null;

  return (
    <div className={`intro ${leaving ? "introLeaving" : ""}`}>
      <div className="particles" aria-hidden="true" />
      <div className="introContent">
        <div className="seal">II</div>
        <p className="introPhrase first">
          Porque hay amistades que nacen del servicio...
        </p>
        <p className="introPhrase second">
          ...y tradiciones que merecen celebrarse.
        </p>
        <h1 className="introTitle">
          II Gran Gala Nacional
          <span>de los Alguaciles de Chile 2026</span>
        </h1>
        <button className="goldButton" onClick={closeIntro}>
          Entrar a la Gala
        </button>
        <button className="skipButton" onClick={closeIntro}>
          Omitir introducción
        </button>
      </div>
    </div>
  );
}
