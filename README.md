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

## Panel administrativo — Sprint 1

Rutas:
- `/admin`
- `/admin/dashboard`

Acceso demostración:
- Usuario: `admin@galaalguaciles.cl`
- Contraseña: `Gala2026!`

Incluye login demostrativo, dashboard, menú lateral, estadísticas, capacidad y últimas inscripciones. El login usa sessionStorage y debe migrarse a Supabase Auth antes de producción.


## Sprint 2 — Gestión operativa

Nuevas rutas:

```text
/admin/asistentes
/admin/circulos
/admin/invitados
```

Funciones demostrativas:

- Crear, editar y eliminar asistentes.
- Buscar y filtrar registros.
- Exportar asistentes a CSV.
- Gestionar Círculos y número de participantes.
- Gestionar invitados especiales y orden protocolar.
- Navegación activa desde el menú lateral.

Los datos de este Sprint son demostrativos y se mantienen solo mientras la página está abierta.
El próximo paso técnico será conectarlos a Supabase para guardarlos en una base de datos real.
