# AGENTS.md

## Proyecto

Food Research Lab es una plataforma de investigación gastronómica: productos, precios, formulaciones, experimentos, evaluación sensorial, nutrición y hallazgos. El primer caso es el chocolate caliente estilo español. Supabase es la fuente central de datos.

Lee antes de trabajar:
- [docs/requirements.md](docs/requirements.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/database-design.md](docs/database-design.md) (obligatorio antes de tocar el esquema)
- [docs/implementation-plan.md](docs/implementation-plan.md) (fase actual)

## Alcance actual

Fase 1: base de datos. **No** construyas frontend ni integración con IA hasta que el plan lo indique. No añadas dependencias que la fase actual no necesite.

## Reglas de datos

- No inventes información experimental, precios ni valores nutricionales. Lo que no se sabe queda `null`.
- Distingue lo comprobado (`findings.evidence_level = 'confirmed'`), lo preliminar, las hipótesis (`hypotheses`) y lo planificado (`experiments.status = 'planned'`).
- Los precios solo se añaden. Una receta con experimentos realizados no se edita: se crea `version + 1` con `parent_id`.
- Las cantidades de receta van en la unidad del producto (`g`, `ml` o `unit`).

## Supabase: proyecto propio, mismo flujo que shots-bar

Antes de cambiar algo de Supabase, consulta la documentación oficial: https://supabase.com/docs.

- `supabase/migrations/` es la fuente de verdad. Cada cambio va en una migración nueva, solo hacia adelante. **Nunca** edites una migración ya aplicada.
- Todo comando que cambie estado lleva `--local` o `--linked` explícito. Si el destino es ambiguo, para.
- En cada tabla nueva:
  - columna `owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade`;
  - RLS activado;
  - `revoke all ... from anon, authenticated` y después grants explícitos;
  - una política por operación con `(select auth.uid()) = owner_id`, `to authenticated`;
  - índices para `owner_id` y para cada FK.
- Vistas: `with (security_invoker = true)`, `revoke all from anon, authenticated` y `grant select to authenticated`.
- Funciones: `security invoker` por defecto, con `set search_path = ''`. Si hace falta `security definer`: nombres calificados y `grant execute` explícito.
- Flujo:
  1. `pnpm run supabase:migration:new -- <nombre>`
  2. `pnpm supabase:db:reset:local`
  3. Tests de RLS, con casos permitidos y denegados, en `supabase/tests/`; ejecuta `pnpm supabase:test:local`
  4. `pnpm supabase:types`, luego `pnpm typecheck` y los tests
  5. Commit
  6. `pnpm supabase:db:push:dry-run`
  7. Aprobación explícita del usuario
  8. `pnpm exec supabase db push --linked` (a propósito, no tiene alias)
  9. `pnpm supabase:migrations:list` y `pnpm supabase:types:remote`
- Prohibido salvo que el usuario lo pida: `db reset --linked`, `db push --include-seed`, `migration repair`.
- No hagas commit de `supabase/.temp/`, `supabase/.branches/`, `.env*`, claves ni volcados de datos reales.

### Docker en Windows

- `supabase db reset --local` puede terminar con `Error status 502` **después** de `Restarting containers...`. Eso es la salud de Storage o Kong al reiniciar, no la migración. Si las migraciones aparecen como `Applying migration ...` sin error, la base está bien.
- Si después la API sigue en 502: `pnpm supabase:stop`, luego `pnpm supabase:start`.
- El contenedor `vector` (logs) entra en bucle de reinicios porque no alcanza el daemon de Docker. Si bloquea `supabase start` por conflicto de nombre, elimina solo ese contenedor: `docker rm -f supabase_vector_food_research_lab`.

## Anti-pausa (plan Free)

Hay dos piezas: la función `public.keepalive()`, ejecutable solo por `anon`, y el workflow `.github/workflows/supabase-keepalive.yml`, que la llama 3 veces al día. Necesita los secrets `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`, y que el repo sea **privado**: en repos públicos, GitHub desactiva los cron tras 60 días sin actividad.
