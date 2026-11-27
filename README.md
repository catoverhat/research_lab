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
pnpm test                    # tests unitarios (node --test)
pnpm dev                     # app en http://localhost:3000
pnpm supabase:stop
```

### Frontend en local

1. Copia `.env.example` a `.env.local` con la URL y la clave publicable de `pnpm supabase:status`.
2. Crea `supabase/.env` con la clave secreta de prueba de Turnstile (está en `.env.example`) y reinicia el stack.
3. El registro está desactivado. Crea un usuario con la API de administración local o desde Studio (`http://127.0.0.1:54323`, Authentication), con el email confirmado.
4. Abre `http://localhost:3000`, no `127.0.0.1`: las passkeys necesitan un dominio.

Despliegue y reglas: [AGENTS.md](AGENTS.md). Modelo de datos: [docs/database-design.md](docs/database-design.md).
