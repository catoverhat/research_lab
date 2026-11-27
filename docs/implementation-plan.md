# Plan de implementación

| Fase | Alcance | Estado |
|------|---------|--------|
| 1 | Modelo de datos, RLS, vistas, exportación JSON, keepalive, documentación | Desplegado en el proyecto hosted `rbdkuhjzkngjppqseyak` (us-east-1, Postgres 17). Faltan los pasos de abajo |
| 2 | Importar la investigación del chocolate (JSON de ChatGPT → script en una transacción) | Pendiente de recibir los JSON |
| 3 | Next.js: auth y CRUD de productos, precios, formulaciones y experimentos | Pendiente |
| 4 | Dashboard económico y sensorial (Recharts sobre las vistas) | Pendiente |
| 5 | Integración con IA (exportación JSON y luego MCP de solo lectura) | Pendiente |
| 6 | Informes PDF a partir de `research_reports` | Pendiente |
| 7 | Optimización y comparación de formulaciones | Pendiente |

## Pendiente para cerrar la fase 1

Hecho: proyecto creado, enlazado, Postgres 17 comprobado y las dos migraciones aplicadas y verificadas.

1. GitHub: confirmar que el repo es **privado** y añadir los secrets `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. Luego, en Actions → `supabase-keepalive` → Run workflow, comprobar que responde `1`.
2. Auth en el dashboard de Supabase: activar los inicios de sesión anónimos, la vinculación manual y Turnstile (`config.toml` solo configura el entorno local).
