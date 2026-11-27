# Plan de implementación

| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Modelo de datos, RLS, vistas, exportación JSON, keepalive, documentación | Desplegado en el proyecto hosted `rbdkuhjzkngjppqseyak` (us-east-1, Postgres 17). Keepalive verificado |
| 2 | Importar la investigación del chocolate (JSON de ChatGPT → script en una transacción) | Hecho el 2026-11-27: importado en hosted (16 recetas, 5 experimentos, 11 precios verificados) y etiquetas cargadas (13 de 16 recetas con nutrición). Falta la porción de Embajador (F02–F04) |
| 3 | Next.js organizado por núcleo común y módulos (ver `architecture.md`): auth (Turnstile antes de publicar; passkeys, comprobando qué ofrece Supabase Auth en el plan Free) y CRUD de productos, precios, formulaciones y experimentos | Pendiente |
| 4 | Dashboard económico y sensorial (Recharts sobre las vistas) | Pendiente |
| 5 | Integración con IA (exportación JSON y luego MCP de solo lectura) | Pendiente |
| 6 | Informes PDF a partir de `research_reports` | Pendiente |
| 7 | Optimización y comparación de formulaciones | Pendiente |
| — | Módulo de compras y matriz de decisión (ver `architecture.md`, "Módulos") | Cuando llegue la primera investigación de compra |

## Estado de la fase 1

- Proyecto hosted creado, enlazado y con Postgres 17. Migraciones aplicadas y verificadas.
- Repo privado en GitHub con los secrets `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. El workflow `supabase-keepalive` responde `1`.
- Auth en el dashboard: confirmación de email desactivada. Turnstile se activa en la fase 3, cuando exista el dominio del frontend (`config.toml` solo configura el entorno local).
