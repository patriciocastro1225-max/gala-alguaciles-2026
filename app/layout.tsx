import type { Metadata } from "next";
import "./globals.css";
import CircleRegistrationAssist from "@/components/CircleRegistrationAssist";

export const metadata: Metadata = {
  title: "II Gran Gala Nacional de los Alguaciles de Chile 2026",
  description:
    "Una noche de amistad, tradición y camaradería. 25 de noviembre de 2026, Club Palestino, Santiago de Chile.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {children}
        <CircleRegistrationAssist />
      </body>
    </html>
  );
}
