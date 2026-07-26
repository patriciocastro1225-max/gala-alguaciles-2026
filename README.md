# II Gran Gala Nacional de los Alguaciles de Chile 2026

Primera versión del sitio oficial desarrollada con Next.js.

## Requisitos

- Node.js 20 o superior
- npm

## Ejecutar en el computador

```bash
npm install
npm run dev
```

Luego abrir:

```text
http://localhost:3000
```

## Antes de publicar

1. Reemplazar en `app/page.tsx`:
   - `https://form.jotform.com/`
   por el enlace real del formulario de reserva.

2. Agregar en la carpeta `public`:
   - `hero-placeholder.jpg`
   - `venue-placeholder.jpg`

3. Opcionalmente reemplazar el círculo con “II” por el escudo o logotipo oficial.

## Publicar en Netlify o Vercel

### Vercel
- Subir el proyecto a GitHub.
- Importarlo desde Vercel.
- Vercel detectará Next.js automáticamente.

### Netlify
- Conectar el repositorio.
- Comando de compilación: `npm run build`
- Netlify detectará automáticamente el proyecto Next.js.

## Secciones incluidas

- Introducción animada.
- Portada principal.
- Cuenta regresiva.
- Presentación de la Gala.
- Programa.
- Invitados especiales.
- Círculos participantes.
- Testimonios.
- Ubicación.
- Botones de reserva.
- Diseño adaptable para celulares.
