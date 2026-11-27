# Plan de implementación

| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Modelo de datos, RLS, vistas, exportación JSON, keepalive, documentación | Hecho en local. Falta enlazar el proyecto y desplegar |
| 2 | Importar la investigación del chocolate (JSON de ChatGPT → script en una transacción) | Pendiente de recibir los JSON |
| 3 | Next.js: auth y CRUD de productos, precios, formulaciones y experimentos | Pendiente |
| 4 | Dashboard económico y sensorial (Recharts sobre las vistas) | Pendiente |
| 5 | Integración con IA (exportación JSON y luego MCP de solo lectura) | Pendiente |
| 6 | Informes PDF a partir de `research_reports` | Pendiente |
| 7 | Optimización y comparación de formulaciones | Pendiente |

## Pendiente para cerrar la fase 1

1. Crear el proyecto en Supabase (plan Free) y obtener su `PROJECT_REF`.
2. Enlazarlo: `pnpm exec supabase link --project-ref <PROJECT_REF>`.
3. Comprobar con `SHOW server_version;` que la versión mayor coincide con `[db] major_version = 17` en `supabase/config.toml`.
4. Ejecutar `pnpm supabase:db:push:dry-run`, revisarlo, aprobarlo y lanzar `pnpm exec supabase db push --linked`.
5. Comprobar con `pnpm supabase:migrations:list` y `pnpm supabase:types:remote` (sin diff).
6. GitHub: confirmar que el repo es **privado** y añadir los secrets `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. Luego, en Actions → `supabase-keepalive` → Run workflow, comprobar que responde `1`.
7. Auth en el dashboard de Supabase: activar los inicios de sesión anónimos, la vinculación manual y Turnstile (`config.toml` solo configura el entorno local).
