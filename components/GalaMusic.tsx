"use client";

import { Music2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TRACK_URL = "https://upload.wikimedia.org/wikipedia/commons/c/c5/Waltz_no._18_-_op._posth_Eb-major.mp3";

export default function GalaMusic() {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(TRACK_URL);
    audio.loop = true;
    audio.preload = "none";
    audio.volume = 0.22;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  async function startMusic() {
    const audio = audioRef.current;
    if (!audio) return;

    setError("");
    try {
      audio.volume = 0.22;
      await audio.play();
      setPlaying(true);
      localStorage.setItem("gala-music-preference", "on");
    } catch {
      setPlaying(false);
      setError("NO FUE POSIBLE INICIAR LA MÚSICA EN ESTE DISPOSITIVO.");
    }
  }

  function stopMusic() {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setPlaying(false);
    localStorage.setItem("gala-music-preference", "off");
  }

  async function toggleMusic() {
    if (playing) stopMusic();
    else await startMusic();
  }

  return (
    <>
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
      {error && (
        <div style={{position:"fixed",right:22,bottom:78,zIndex:10000,maxWidth:280,padding:"10px 12px",borderRadius:8,background:"rgba(75,20,20,.94)",color:"white",fontSize:11,fontWeight:700}}>
          {error}
        </div>
      )}
    </>
  );
}
