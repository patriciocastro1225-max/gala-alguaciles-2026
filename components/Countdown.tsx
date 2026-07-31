"use client";

import { useEffect, useMemo, useState } from "react";

const EVENT_DATE = new Date("2026-11-25T20:00:00-03:00").getTime();

function calculate() {
  const distance = Math.max(0, EVENT_DATE - Date.now());
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
    finished: distance === 0,
  };
}

export default function Countdown() {
  const [remaining, setRemaining] = useState(calculate());

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(calculate()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const units = useMemo(() => [
    ["Días", remaining.days],
    ["Horas", remaining.hours],
    ["Minutos", remaining.minutes],
    ["Segundos", remaining.seconds],
  ], [remaining]);

  if (remaining.finished) {
    return <p className="countdownFinished">La gran noche ha comenzado.</p>;
  }

  return (
    <div className="countdownGrid" aria-label="Cuenta regresiva para la Gala">
      {units.map(([label, value]) => (
        <div className="countdownUnit" key={String(label)}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
