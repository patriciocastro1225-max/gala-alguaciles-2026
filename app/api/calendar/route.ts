import { NextResponse } from "next/server";

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export async function GET() {
  const title = "II Gran Gala Nacional de los Alguaciles de Chile 2026";
  const description = "II Gran Gala Nacional de los Alguaciles de Chile 2026. Tenida: Formal Sport.";
  const location = "Club Palestino, Av. Presidente Kennedy 9351, Las Condes, Santiago, Chile";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gran Gala Alguaciles 2026//grangala.cl//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:gala-alguaciles-2026@grangala.cl",
    "DTSTAMP:20260911T154300Z",
    "DTSTART;TZID=America/Santiago:20261125T200000",
    "DTEND;TZID=America/Santiago:20261126T020000",
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location)}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio II Gran Gala Nacional 2026",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="II-Gran-Gala-Nacional-2026.ics"',
      "Cache-Control": "public, max-age=86400",
    },
  });
}
