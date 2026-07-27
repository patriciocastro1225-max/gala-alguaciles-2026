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


## Sprint 3 — Mesas y plano del salón

Nueva ruta:

```text
/admin/mesas
```

Funciones demostrativas:

- Plano visual del salón con 22 mesas.
- Zona de autoridades, salón central y zona general.
- Estado por color: disponible, pocos cupos o completa.
- Selección de cada mesa para revisar sus asistentes.
- Agregar y quitar personas.
- Mover personas a la mesa anterior o siguiente.
- Editar nombre, capacidad y zona de cada mesa.
- Filtros por nombre y zona.
- Resumen de cupos totales, asignados y disponibles.

Los cambios son demostrativos y permanecen mientras la página está abierta.
La conexión con Supabase permitirá guardar la distribución real.


## Sprint 4 — Correos, QR y check-in

Nuevas rutas:

```text
/admin/correos
/admin/qr
/admin/checkin
```

Incluye:

- Redacción de comunicados segmentados.
- Plantillas de confirmación, pago e información general.
- Vista previa de correos.
- Historial demostrativo de envíos.
- Credencial QR individual por asistente.
- Acciones de regenerar, descargar y enviar QR.
- Check-in por código manual.
- Simulación de escaneo QR.
- Registro de hora de ingreso.
- Prevención demostrativa de ingresos duplicados.
- Listado operativo de asistentes.

En producción:

- Los correos se conectarán a Resend o servicio equivalente.
- Los códigos QR se generarán desde la base de datos.
- El escáner usará la cámara del teléfono o tablet.
- El check-in quedará registrado en Supabase.


## Sprint 5 — Pagos y estadísticas

Nuevas rutas:

```text
/admin/pagos
/admin/estadisticas
```

Incluye:

- Registro, edición y eliminación de pagos.
- Estados pagado, pendiente y parcial.
- Métodos transferencia, Webpay, efectivo e invitación.
- Referencias y fechas de pago.
- Exportación de pagos a CSV.
- Indicadores financieros.
- Estadísticas de inscritos, confirmados, mesas y recaudación.
- Evolución mensual de inscripciones.
- Ranking de Círculos participantes.
- Distribución de métodos de pago.
- Proyección de check-in.
- Exportación de informe resumido.

Los datos continúan siendo demostrativos. El siguiente paso será la conexión real con Supabase y autenticación por usuarios.
