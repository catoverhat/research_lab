# Plan de implementación

| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Modelo de datos, RLS, vistas, exportación JSON, keepalive, documentación | Desplegado en el proyecto hosted `rbdkuhjzkngjppqseyak` (us-east-1, Postgres 17). Keepalive verificado |
| 2 | Importar la investigación del chocolate (JSON de ChatGPT → script en una transacción) | Hecho el 2026-11-27: importado en hosted (16 recetas, 5 experimentos, 11 precios verificados) y etiquetas cargadas (13 de 16 recetas con nutrición). Falta la porción de Embajador (F02–F04) |
| 3 | Next.js organizado por núcleo común y módulos (ver `architecture.md`): auth (Turnstile antes de publicar; passkeys, comprobando qué ofrece Supabase Auth en el plan Free) y CRUD de productos, precios, formulaciones y experimentos | Desplegado el 2026-11-27 en `https://research-lab-catoverhat.vercel.app` (ver "Estado de la fase 3") |
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
- Revisión con los agentes `nextjs-reviewer` y `ui-ux-reviewer`, y sus hallazgos aplicados. Las reglas que protegen datos pasaron a la base (migración `20261127162447_domain_rules_in_database`, aplicada también en hosted).

Publicado el 2026-11-27 (ver "Entornos" en `architecture.md`):
- Vercel Hobby, proyecto `research-lab-catoverhat`, conectado al repo: cada push a `main` publica `https://research-lab-catoverhat.vercel.app`.
- Auth en hosted, comprobado con sondas reales: registro y login anónimo desactivados (`signup_disabled`, `anonymous_provider_disabled`), Turnstile obligatorio (`captcha_failed` sin token) y passkeys con RP ID `research-lab-catoverhat.vercel.app`.
- El login de producción carga el widget de Turnstile sin error de dominio.

Pendiente:
- Que el usuario entre por primera vez en producción con su contraseña y registre su passkey (no se puede automatizar: Turnstile bloquea navegadores automatizados).
- Fuera de esta fase: evaluaciones sensoriales, hipótesis y hallazgos, fuentes, adjuntos y la ficha nutricional en la UI. Siguen cargándose por scripts.
