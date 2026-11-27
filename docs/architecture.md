# Arquitectura

## Componentes

```mermaid
flowchart LR
  UI["Next.js App Router<br/>(fase 3+)"] -->|supabase-js + RLS| SB[(Supabase<br/>Postgres · Auth · Storage)]
  SB -->|v_research_context JSON| AI["IA: ChatGPT / Claude<br/>(fase 5)"]
  GH["GitHub Actions<br/>keepalive"] -->|rpc/keepalive| SB
```

- **Supabase es la fuente central.** Guarda los datos estructurados, las fotos y etiquetas (Storage) y los usuarios (Auth). Los cálculos viven en vistas SQL.
- **Next.js (fase 3 en adelante, última versión estable).** Usará el stack de shots-bar: App Router, TypeScript, Tailwind, shadcn/ui, React Hook Form + Zod y Recharts. Tipos generados en `src/shared/database/database.types.ts`.
- **IA (fase 5).** Se empieza por lo más simple: exportar el JSON de `v_research_context` y adjuntarlo a la conversación. Después, si hace falta, el servidor MCP oficial de Supabase en modo solo lectura y limitado al proyecto: `https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true&features=database`.

No hacen falta pgvector ni RAG: los datos son estructurados y SQL los compara con precisión.

## Entornos

| Entorno | Qué es | Cómo se toca |
|---------|--------|--------------|
| Local | Stack de Supabase en Docker (`project_id = food_research_lab`) | `pnpm supabase:*` (local es el destino por defecto del CLI v3) |
| Hosted | Proyecto propio de Supabase, plan Free | `--remote`, siempre después de un dry-run y con aprobación |

Auth tiene la misma configuración que shots-bar: signup, inicio de sesión anónimo, vinculación manual de cuentas y rotación de refresh tokens activados. Captcha Turnstile (`SUPABASE_AUTH_CAPTCHA_SECRET`). Sin confirmación de email.

## Decisiones

- **Propiedad por fila, sin roles.** Es una herramienta personal. Si algún día se comparte un proyecto, se añadirían miembros por proyecto y FK compuestas (ver `database-design.md`).
- **Sin backend propio (NestJS).** RLS, vistas y Server Actions bastan.
- **El diseño de los datos está en** [database-design.md](database-design.md).
