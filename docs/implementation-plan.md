# Plan de implementación

| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Modelo de datos, RLS, vistas, exportación JSON, keepalive, documentación | Desplegado en el proyecto hosted `rbdkuhjzkngjppqseyak` (us-east-1, Postgres 17). Keepalive verificado |
| 2 | Importar la investigación del chocolate (JSON de ChatGPT → script en una transacción) | Hecho el 2026-11-27: importado en hosted (16 recetas, 5 experimentos, 11 precios verificados) y etiquetas cargadas (13 de 16 recetas con nutrición). Falta la porción de Embajador (F02–F04) |
| 3 | Next.js organizado por núcleo común y módulos (ver `architecture.md`): auth (Turnstile antes de publicar; passkeys, comprobando qué ofrece Supabase Auth en el plan Free) y CRUD de productos, precios, formulaciones y experimentos | Hecho en local el 2026-11-27. Falta publicar (ver "Estado de la fase 3") |
| 4 | Dashboard económico y sensorial (Recharts sobre las vistas) | Pendiente |
| 5 | Integración con IA (exportación JSON y luego MCP de solo lectura) | Pendiente |
| 6 | Informes PDF a partir de `research_reports` | Pendiente |
| 7 | Optimización y comparación de formulaciones | Pendiente |
| — | Módulo de compras y matriz de decisión (ver `architecture.md`, "Módulos") | Cuando llegue la primera investigación de compra |

## Estado de la fase 1

- Proyecto hosted creado, enlazado y con Postgres 17. Migraciones aplicadas y verificadas.
- Repo privado en GitHub con los secrets `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. El workflow `supabase-keepalive` responde `1`.
- Auth en el dashboard: confirmación de email desactivada. Turnstile se activa en la fase 3, cuando exista el dominio del frontend (`config.toml` solo configura el entorno local).

## Estado de la fase 3

Hecho y probado en local, con los datos del chocolate importados:
- Login con email y contraseña o con passkey, protegido con Turnstile. Gestión de passkeys en `/account`.
- Proyectos (lista, alta, edición), productos (alta, edición, borrado), precios (solo añadir, con proveedor y URL de la fuente), formulaciones (ingredientes, coste, nutrición, congelación y versión nueva) y experimentos (alta, edición, borrado).
- Prueba de punta a punta (`pnpm test:e2e`, en `e2e/smoke.mjs`) en Edge sin ventana, con un autenticador WebAuthn virtual.
- Revisión con los agentes `nextjs-reviewer` y `ui-ux-reviewer`, y sus hallazgos aplicados. Las reglas que protegen datos pasaron a la base (migración `20261127162447_domain_rules_in_database`, aplicada en local y pendiente de subir a hosted con aprobación).

Pendiente:
- **Antes de publicar** (en el dashboard del proyecto hosted, con aprobación): desactivar el registro y el login anónimo, activar las passkeys con el dominio de producción como RP ID y origen, y activar Turnstile con la clave secreta real.
- Desplegar en Vercel, plan Hobby (gratis, decidido el 2026-11-27), con el dominio `<proyecto>.vercel.app` y las variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. `vercel.app` es un sufijo público, así que el RP ID de las passkeys es el subdominio completo. Las passkeys y Turnstile solo funcionan en el dominio de producción, no en los previews.
- Fuera de esta fase: evaluaciones sensoriales, hipótesis y hallazgos, fuentes, adjuntos y la ficha nutricional en la UI. Siguen cargándose por scripts.
