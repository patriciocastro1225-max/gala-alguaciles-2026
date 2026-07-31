# Configuración de Netlify

En **Site configuration > Environment variables** deben existir:

```text
NEXT_PUBLIC_SUPABASE_URL=https://ysvwxglkzlohplsyobgu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_publica
```

No publiques ni uses la clave `service_role` en Netlify.

Después de modificar variables:

1. Ve a **Deploys**.
2. Ejecuta **Trigger deploy > Clear cache and deploy site**.
3. Comprueba `/sprint-version.txt`.
