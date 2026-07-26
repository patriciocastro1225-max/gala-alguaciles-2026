"use client";

import {
  CalendarDays,
  Car,
  ChevronDown,
  Clock3,
  MapPin,
  Menu,
  Music2,
  Quote,
  Sparkles,
  TicketCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import Countdown from "@/components/Countdown";
import Intro from "@/components/Intro";

const reservationUrl = "https://form.jotform.com/";

const program = [
  ["20:00", "Recepción", "Bienvenida y acreditación de los asistentes."],
  ["20:30", "Cóctel", "Encuentro de camaradería y recepción oficial."],
  ["21:00", "Cena", "Cena de gala en el salón principal."],
  ["22:15", "Invitados especiales", "Participación de invitados de relevancia institucional y nacional."],
  ["23:00", "Show musical", "Presentación artística para todos los asistentes."],
  ["23:45", "Baile y DJ", "Música, celebración y encuentro entre Círculos."],
  ["02:00", "Cierre", "Despedida oficial de la II Gran Gala Nacional."],
];

const testimonials = [
  ["Alejandro Axxxx", "Fue una noche inolvidable, todo bien preparado, una linda recepción, gracias por la ocasión."],
  ["Alberto Mxxx", "Magnífica noche, con invitados de lujo, me encantó."],
  ["Fernando Pexxxxx", "Bailé hasta las 2 de la mañana, lo pasamos divino con mi señora."],
  ["Emilio Gxxxxx", "Fui con mi círculo, reservamos una mesa, hicimos premiaciones y entregamos premios; fue una ocasión única."],
  ["Donatto Gxxx", "Viajé de Rancagua exclusivamente para esta noche, fue especialmente entretenida."],
  ["Jhonny Mxxxxxx", "Fui con mi polola, bailamos hasta muy tarde, fue inolvidable."],
];

const circles = [
  ["Antofagasta", "Próximamente"],
  ["Valparaíso", "Próximamente"],
  ["Santiago", "Confirmado"],
  ["Rancagua", "Próximamente"],
  ["Concepción", "Próximamente"],
  ["Temuco", "Próximamente"],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Intro />

      <header className="navbar">
        <a href="#inicio" className="brand" aria-label="Ir al inicio">
          <span className="brandSeal">II</span>
          <span>
            Gala Nacional
            <small>Alguaciles de Chile</small>
          </span>
        </a>

        <nav className={menuOpen ? "navLinks navOpen" : "navLinks"}>
          {[
            ["La Gala", "#gala"],
            ["Programa", "#programa"],
            ["Invitados", "#invitados"],
            ["Círculos", "#circulos"],
            ["Testimonios", "#testimonios"],
            ["Lugar", "#lugar"],
          ].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <a className="navReserve" href={reservationUrl} target="_blank" rel="noreferrer">
            Reserva pagando aquí
          </a>
        </nav>

        <button
          className="menuButton"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="heroOverlay" />
          <div className="heroContent">
            <div className="heroSeal">II</div>
            <p className="eyebrow">25 de noviembre de 2026 · 20:00 horas</p>
            <h1>
              Gran Gala Nacional
              <span>de los Alguaciles de Chile</span>
            </h1>
            <p className="motto">
              Porque hay amistades que nacen del servicio...
              <br />
              y tradiciones que merecen celebrarse.
            </p>

            <Countdown />

            <div className="heroActions">
              <a className="goldButton" href={reservationUrl} target="_blank" rel="noreferrer">
                <TicketCheck size={20} />
                Reserva pagando aquí
              </a>
              <a className="ghostButton" href="#gala">
                Conocer la Gala
              </a>
            </div>
          </div>
          <a href="#gala" className="scrollHint" aria-label="Bajar a la siguiente sección">
            <ChevronDown />
          </a>
        </section>

        <section className="section story" id="gala">
          <div className="sectionLabel">La Gala</div>
          <div className="storyGrid">
            <div>
              <p className="eyebrow">Un encuentro nacional</p>
              <h2>Una noche para fortalecer la amistad y la tradición</h2>
            </div>
            <div className="storyText">
              <p>
                La II Gran Gala Nacional reunirá a Alguaciles de distintos Círculos
                de Chile en una noche de camaradería, encuentro y celebración.
              </p>
              <p>
                Será una ocasión para compartir con invitados de relevancia
                institucional y nacional, renovar vínculos y continuar construyendo
                una tradición que representa el espíritu de servicio y amistad.
              </p>
              <div className="facts">
                <span><CalendarDays /> 25 de noviembre de 2026</span>
                <span><Clock3 /> 20:00 horas</span>
                <span><MapPin /> Club Palestino, Santiago</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section darkSection" id="programa">
          <div className="sectionHeading">
            <p className="eyebrow">Programa</p>
            <h2>Una experiencia preparada para compartir</h2>
          </div>

          <div className="timeline">
            {program.map(([time, title, description], index) => (
              <article className="timelineItem" key={time}>
                <div className="timelineTime">{time}</div>
                <div className="timelineDot">{index + 1}</div>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section guests" id="invitados">
          <div className="sectionHeading">
            <p className="eyebrow">Invitados especiales</p>
            <h2>Relevancia institucional y nacional</h2>
            <p>
              Las confirmaciones serán anunciadas oficialmente a medida que se
              incorporen al programa.
            </p>
          </div>

          <div className="guestGrid">
            {[1, 2, 3].map((item) => (
              <article className="guestCard" key={item}>
                <div className="guestSilhouette">
                  <UsersRound size={72} />
                </div>
                <Sparkles size={18} />
                <h3>Confirmación próximamente</h3>
                <p>Invitado de relevancia institucional o nacional.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section circlesSection" id="circulos">
          <div className="sectionHeading">
            <p className="eyebrow">Círculos participantes</p>
            <h2>Chile se reúne en una misma noche</h2>
          </div>

          <div className="circlesLayout">
            <div className="chileMap" aria-label="Representación artística del mapa de Chile">
              <div className="mapLine" />
              {circles.map(([city, status], index) => (
                <div className={`mapPoint point${index + 1}`} key={city}>
                  <span />
                  <div>
                    <strong>{city}</strong>
                    <small>{status}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="circleCopy">
              <h3>Cada confirmación encenderá una nueva luz</h3>
              <p>
                A medida que los Círculos confirmen su participación, el mapa se
                actualizará con su ciudad, escudo y número de asistentes.
              </p>
              <div className="statCard">
                <strong>01</strong>
                <span>Círculo confirmado</span>
              </div>
              <div className="statCard">
                <strong>06</strong>
                <span>Ciudades representadas inicialmente</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section testimonials" id="testimonios">
          <div className="sectionHeading">
            <p className="eyebrow">Testimonios</p>
            <h2>Recuerdos de la primera Gala</h2>
          </div>

          <div className="testimonialTrack">
            {testimonials.map(([name, text]) => (
              <article className="testimonialCard" key={name}>
                <Quote size={30} />
                <p>“{text}”</p>
                <strong>{name}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="section venue" id="lugar">
          <div className="venuePanel">
            <p className="eyebrow">Lugar</p>
            <h2>Club Palestino</h2>
            <p className="venueAddress">
              Av. Presidente Kennedy 9351, Las Condes, Santiago.
            </p>

            <div className="venueFacts">
              <span><MapPin /> Acceso claramente señalizado</span>
              <span><Car /> Estacionamientos disponibles</span>
              <span><Music2 /> Salón principal y pista de baile</span>
            </div>

            <div className="heroActions">
              <a
                className="goldButton"
                href="https://www.google.com/maps/search/?api=1&query=Club+Palestino+Santiago"
                target="_blank"
                rel="noreferrer"
              >
                Abrir en Google Maps
              </a>
              <a
                className="ghostButton"
                href="https://www.waze.com/ul?q=Club%20Palestino%20Santiago"
                target="_blank"
                rel="noreferrer"
              >
                Abrir en Waze
              </a>
            </div>
          </div>
        </section>

        <section className="closing">
          <div>
            <p>
              La Gala Nacional de los Alguaciles no es solo una celebración.
            </p>
            <h2>
              Es el encuentro donde la amistad, el servicio y la tradición
              continúan escribiendo su historia.
            </h2>
            <a className="goldButton" href={reservationUrl} target="_blank" rel="noreferrer">
              <TicketCheck size={20} />
              Reserva pagando aquí
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="brand">
          <span className="brandSeal">II</span>
          <span>
            Gala Nacional
            <small>Alguaciles de Chile 2026</small>
          </span>
        </div>
        <p>25 de noviembre de 2026 · Club Palestino · Santiago de Chile</p>
      </footer>
    </>
  );
}
