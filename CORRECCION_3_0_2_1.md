# Corrección 3.0.2.1

Se corrigió el error de compilación de Next.js 15 causado por `useSearchParams()` fuera de un límite `Suspense`.

## Archivos corregidos

- `app/inscripcion/confirmacion/page.tsx`
- `app/inscripcion/confirmacion/ConfirmationClient.tsx`
- `app/i/[code]/page.tsx`
- `app/i/[code]/GuestPortalClient.tsx`

No requiere ejecutar nuevamente el SQL de Supabase.
