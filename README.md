# Research Lab

Plataforma para investigar y decidir con evidencia: optimizar recetas (precio, calidad, sabor, nutrición) y, en el futuro, comparar productos antes de comprarlos. El primer caso es el chocolate caliente estilo español. Módulos: [docs/architecture.md](docs/architecture.md).

## Requisitos

- Node 24 y pnpm 12 (`corepack enable`)
- Docker Desktop (solo para la base local)

## Uso

```powershell
pnpm install
pnpm supabase:start          # stack local en Docker
pnpm supabase:db:reset:local # recrea la base local desde las migraciones
pnpm supabase:test:local     # tests pgTAP (RLS, vistas, bloqueo de recetas)
pnpm supabase:types          # regenera src/shared/database/database.types.ts
pnpm typecheck
pnpm supabase:stop
```

Despliegue y reglas: [AGENTS.md](AGENTS.md). Modelo de datos: [docs/database-design.md](docs/database-design.md).
