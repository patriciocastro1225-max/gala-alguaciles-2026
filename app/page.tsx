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
  TicketCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Countdown from "@/components/Countdown";
import Intro from "@/components/Intro";
import { listPublicCircles } from "@/services/circles";
import type { Circle } from "@/types/database";

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



export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [circlesLoading, setCirclesLoading] = useState(true);
  const [circlesError, setCirclesError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listPublicCircles()
      .then((data) => {
        if (!active) return;
        setCircles(data);
        setCirclesError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCirclesError(error instanceof Error ? error.message : "No fue posible cargar los Círculos.");
      })
      .finally(() => {
        if (active) setCirclesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const confirmedCircles = useMemo(
    () => circles.filter((circle) => circle.confirmed).length,
    [circles],
  );

  const representedCities = useMemo(
    () => new Set(circles.map((circle) => circle.city?.trim()).filter(Boolean)).size,
    [circles],
  );

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

        
        <section className="section countdownSection" id="cuenta-regresiva">
          <div className="sectionHeading centeredHeading">
            <p className="eyebrow">Falta cada vez menos</p>
            <h2>Una noche para recordar</h2>
            <p>
              Miércoles 25 de noviembre de 2026 · 20:00 horas · Club Palestino
            </p>
          </div>
          <Countdown />
        </section>

        <section className="section galaProgram" id="programa">
          <div className="sectionHeading centeredHeading">
            <p className="eyebrow">Programa de la noche</p>
            <h2>Una celebración preparada en cada detalle</h2>
          </div>

          <div className="programTimeline">
            <article>
              <span>20:00</span>
              <div>
                <h3>Recepción y acreditación</h3>
                <p>Bienvenida a autoridades, Alguaciles e invitados.</p>
              </div>
            </article>
            <article>
              <span>20:45</span>
              <div>
                <h3>Apertura oficial</h3>
                <p>Inicio de la ceremonia y palabras institucionales.</p>
              </div>
            </article>
            <article>
              <span>21:15</span>
              <div>
                <h3>Cena de gala</h3>
                <p>Servicio especialmente preparado para esta celebración nacional.</p>
              </div>
            </article>
            <article>
              <span>22:30</span>
              <div>
                <h3>Reconocimientos y camaradería</h3>
                <p>Un momento para distinguir el servicio, la amistad y la tradición.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="section galaGuide" id="informacion">
          <div className="guideGrid">
            <article>
              <p className="eyebrow">Vestimenta</p>
              <h3>Tenida formal</h3>
              <p>
                Se solicita vestimenta formal, acorde al carácter solemne e
                institucional de la ceremonia.
              </p>
            </article>
            <article>
              <p className="eyebrow">Lugar</p>
              <h3>Club Palestino</h3>
              <p>
                Avenida Presidente Kennedy Nº 9351, Las Condes, Santiago de Chile.
              </p>
            </article>
            <article>
              <p className="eyebrow">Puntualidad</p>
              <h3>Recepción desde las 20:00</h3>
              <p>
                Recomendamos llegar con anticipación para realizar la acreditación
                y ubicación de mesa.
              </p>
            </article>
          </div>
        </section>

<section className="section guests guestsSprint74" id="invitados" data-version="7.4">
          <div className="institutionalGuestNotice">
            <p className="eyebrow">Invitados especiales</p>
            <h2>Invitados de renombre institucional y nacional</h2>
            <p>
              La II Gran Gala Nacional de los Alguaciles de Chile 2026 contará
              con la distinguida presencia de invitados de renombre institucional
              y nacional.
            </p>
          </div>
        </section>

        <section className="section circlesSection" id="circulos">
          <div className="sectionHeading">
            <p className="eyebrow">Círculos participantes</p>
            <h2>Chile se reúne en una misma noche</h2>
          </div>

          <div className="circlesLayout">
            <div className="chileMap" aria-label="Círculos participantes de Chile">
              <div className="mapLine" />
              <div className="mapPoints">
                {circlesLoading && <p className="publicCirclesMessage">Cargando Círculos participantes…</p>}

                {!circlesLoading && circlesError && (
                  <p className="publicCirclesMessage error">No fue posible actualizar los Círculos en este momento.</p>
                )}

                {!circlesLoading && !circlesError && circles.length === 0 && (
                  <p className="publicCirclesMessage">Los primeros Círculos participantes se publicarán próximamente.</p>
                )}

                {!circlesLoading && !circlesError && circles.map((circle) => (
                  <article
                    className={circle.confirmed ? "mapPoint confirmed" : "mapPoint pending"}
                    key={circle.id}
                  >
                    <span aria-hidden="true" />
                    <div>
                      <strong>{circle.city || circle.name}</strong>
                      <small>{circle.name}</small>
                      <em>{circle.confirmed ? "Confirmado" : "Próximamente"}</em>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="circleCopy">
              <h3>Cada confirmación encenderá una nueva luz</h3>
              <p>
                Los Círculos creados en el panel administrativo se publican aquí
                automáticamente. Al marcar su participación como confirmada, su luz
                se encenderá en color dorado.
              </p>
              <div className="statCard">
                <strong>{String(confirmedCircles).padStart(2, "0")}</strong>
                <span>{confirmedCircles === 1 ? "Círculo confirmado" : "Círculos confirmados"}</span>
              </div>
              <div className="statCard">
                <strong>{String(representedCities).padStart(2, "0")}</strong>
                <span>{representedCities === 1 ? "Ciudad representada" : "Ciudades representadas"}</span>
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

        <section className="venueFinalPhoto" aria-label="Club Palestino, sede de la Gala">
          <div className="venueFinalPhotoFrame">
            <img
              src="/images/club-palestino-gala-2026.webp"
              alt="Fachada del Club Palestino, sede de la II Gran Gala Nacional de los Alguaciles de Chile 2026"
              loading="lazy"
            />
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
