# Versión 2.0.1 — Corrección de despliegue Netlify

## Corrección

La página `/admin/correos` utilizaba `useSearchParams()` directamente en una página
de Next.js 15. Durante el build de producción, Next.js puede exigir que ese hook quede
dentro de un `Suspense`, provocando un fallo de compilación.

En esta versión se elimina esa dependencia del prerender y el parámetro `attendee`
se lee del navegador después de montar el componente.

## Importante

- No cambia la base de datos.
- No requiere volver a ejecutar el SQL de la Versión 2.0 si ya fue ejecutado.
- Mantiene el plano interactivo y todas las funciones de la Versión 1.2.
