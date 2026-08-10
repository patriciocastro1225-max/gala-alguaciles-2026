"use client";

import { Music2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NOTES = [
  [261.63, 329.63, 392.0],
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [196.0, 246.94, 293.66],
];

export default function GalaMusic() {
  const [playing, setPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      try { audioContextRef.current?.close(); } catch {}
    };
  }, []);

  function scheduleChord() {
    const ctx = audioContextRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    const chord = NOTES[stepRef.current % NOTES.length];
    stepRef.current += 1;

    chord.forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = 1800;
      filter.Q.value = 0.25;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.18 : 0.11, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 7);
    });
  }

  async function startMusic() {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    let ctx = audioContextRef.current;
    if (!ctx || ctx.state === "closed") {
      ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      masterGainRef.current = null;
    }

    if (ctx.state === "suspended") await ctx.resume();

    if (!masterGainRef.current) {
      const master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      masterGainRef.current = master;
    } else {
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterGainRef.current.gain.setValueAtTime(0.55, ctx.currentTime);
    }

    if (timerRef.current) window.clearInterval(timerRef.current);
    scheduleChord();
    timerRef.current = window.setInterval(scheduleChord, 5600);
    setPlaying(true);
    localStorage.setItem("gala-music-preference", "on");
  }

  function stopMusic() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const ctx = audioContextRef.current;
    const master = masterGainRef.current;
    if (ctx && master) {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
      } catch {}
    }
    setPlaying(false);
    localStorage.setItem("gala-music-preference", "off");
  }

  async function toggleMusic() {
    if (playing) stopMusic();
    else await startMusic();
  }

  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-label={playing ? "Desactivar música" : "Activar música"}
      title={playing ? "Desactivar música" : "Activar música"}
      style={{
        position: "fixed", right: 22, bottom: 22, zIndex: 10000,
        display: "inline-flex", alignItems: "center", gap: 9,
        minHeight: 46, padding: "0 15px", borderRadius: 999,
        border: "1px solid rgba(214,181,95,.72)", background: "rgba(7,31,21,.92)",
        color: "#f3dfaa", boxShadow: "0 10px 30px rgba(0,0,0,.3)",
        backdropFilter: "blur(10px)", cursor: "pointer", fontSize: 12,
        fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase",
      }}
    >
      <Music2 size={16} />
      {playing ? <Volume2 size={16} /> : <VolumeX size={16} />}
      <span>{playing ? "Música activa" : "Activar música"}</span>
    </button>
  );
}
