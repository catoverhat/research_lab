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

### Prueba de punta a punta

`pnpm test:e2e` usa la app como una persona, en un Chrome o Edge sin ventana y con un autenticador de passkeys virtual. Prueba el login, los productos y precios, las versiones de receta, los experimentos y las passkeys, y deja los datos como estaban. La única excepción es una fuente comercial de prueba (`example.com`) por cada ejecución.

Necesita:
- el stack local con los datos del chocolate importados (`research/chocolate/import.mjs`), porque usa un experimento realizado;
- el usuario local `local@research-lab.test` con la contraseña `local-dev-password`, u otro indicado con `E2E_EMAIL` y `E2E_PASSWORD`;
- la app compilada y en marcha: `pnpm build` y luego `pnpm start`.

Busca el navegador en las rutas habituales; si no lo encuentra, indícalo con `E2E_BROWSER`.

Despliegue y reglas: [AGENTS.md](AGENTS.md). Modelo de datos: [docs/database-design.md](docs/database-design.md).
