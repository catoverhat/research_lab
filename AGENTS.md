# AGENTS.md

## Proyecto

Research Lab es una plataforma para investigar y decidir con evidencia: productos, precios, fuentes, hipótesis, experimentos y hallazgos, con un módulo por tipo de investigación (alimentos ahora; compras en el futuro, ver [docs/architecture.md](docs/architecture.md)). El primer caso es el chocolate caliente estilo español. Supabase es la fuente central de datos.

Lee antes de trabajar:
- [docs/requirements.md](docs/requirements.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/database-design.md](docs/database-design.md) (obligatorio antes de tocar el esquema)
- [docs/implementation-plan.md](docs/implementation-plan.md) (fase actual)
- [docs/glossary.md](docs/glossary.md): los términos del dominio. Úsalos igual en la UI, el código y los documentos.

## Forma de trabajar

Principios tomados de [ub-mode](https://github.com/unclebob/ub-mode) que este proyecto aplica:
- Una regla vive en un solo sitio. Si protege los datos, ese sitio es la base (check, trigger o función), y la app solo la muestra.
- Que lo ilegal no se pueda escribir: modela el dominio con restricciones, no con avisos.
- Una operación de varios pasos va en una sola transacción (una función SQL), para que un fallo a mitad no deje nada a medias.
- Para una regla nueva de la base, escribe antes el test pgTAP y míralo fallar por la razón esperada.
- Prueba el comportamiento que ve la persona usuaria, no la implementación.
- Arregla la causa, no el síntoma.
- Cada commit dice por qué, qué cambió y cómo se comprobó (una línea `Verificado:` con los tests y comprobaciones que se ejecutaron).

## Alcance actual

Fase 3 (frontend: auth y CRUD) publicada en Vercel. Fase 4 (experimentación y análisis: informe de experimento, comparador y gráficas) hecha en local. Después viene el rediseño visual con Stitch (4b). **No** construyas integración con IA (fase 5) hasta que el plan lo indique. No añadas dependencias que la fase actual no necesite. Las gráficas siguen la skill de visualización de datos (`dataviz`): cárgala antes de tocar `src/shared/charts/`.

Versiones: usa siempre la última versión estable de cada herramienta y dependencia (Next.js, Supabase CLI, TypeScript, pnpm…). Antes de subir una versión mayor, lee su guía oficial de migración.

## Frontend

- Estructura en [docs/architecture.md](docs/architecture.md#frontend): `core/` (núcleo común), `modules/<tipo>/` (alimentos) y `shared/`. Nada específico del chocolate en el código.
- Antes de usar una API de Next.js, lee su guía en `node_modules/next/dist/docs/`: esta versión cambia APIs y convenciones (`proxy.ts` en vez de `middleware.ts`, `refresh()`, TypeScript 7 con el CLI).
- Cada página y cada Server Action empieza con `requireUser()`. Valida con Zod en el servidor (`src/shared/forms.ts`). No uses la clave secreta en la app.
- Local: la app va en `http://localhost:3000`, no en `127.0.0.1`, porque las passkeys no aceptan una IP como RP ID. Tras cambiar el código: `pnpm typecheck`, `pnpm test` y `pnpm build`. Si cambia una pantalla o una acción, también `pnpm test:e2e` (ver README) y, si la prueba no cubre el cambio, añádelo a `e2e/smoke.mjs`.
- Antes de hacer commit de cambios en el frontend, pasa el agente `nextjs-reviewer` y, si cambian pantallas, `ui-ux-reviewer`. Usan las skills de Vercel de `.claude/skills/` (origen y licencia en `NOTICE.md`).

## Reglas de datos

- No inventes información experimental, precios ni valores nutricionales. Lo que no se sabe queda `null`.
- Distingue lo comprobado (`findings.evidence_level = 'confirmed'`), lo preliminar, las hipótesis (`hypotheses`) y lo planificado (`experiments.status = 'planned'`).
- Los precios solo se añaden. Una receta con experimentos realizados no cambia su composición (productos y cantidades): se crea `version + 1` con `parent_id`. Sus notas sí se pueden editar.
- Un experimento realizado o fallido no vuelve a planificado ni a cancelado (confirmado por el usuario el 2026-11-27). Si se registró por error, se borra.
- Las cantidades de receta van en la unidad del producto (`g`, `ml` o `unit`). Un producto con precios o en recetas no cambia de tamaño ni de unidad: otra presentación es otro producto.
- Por ahora todos los precios son en DOP: las vistas suman sin separar monedas.

## Supabase: proyecto propio, mismo flujo que shots-bar

Antes de cambiar algo de Supabase, consulta la documentación oficial: https://supabase.com/docs.

- `supabase/migrations/` es la fuente de verdad. Cada cambio va en una migración nueva, solo hacia adelante. **Nunca** edites una migración ya aplicada.
- Sin destino, el CLI (v3) actúa sobre el stack local. Todo lo que toque el proyecto hosted lleva `--remote` explícito y al final del comando. Si el destino es ambiguo, para.
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
  8. `pnpm exec supabase db push --remote` (a propósito, no tiene alias). Sin terminal interactiva, el CLI exige `--yes`; úsalo solo después del paso 7.
  9. `pnpm supabase:migrations:list` y `pnpm supabase:types:remote`. El generador remoto es de otra versión: cambia el formato, añade `__InternalSupabase` y marca nullable todas las columnas de las vistas. Si las tablas coinciden, vuelve a los tipos locales con `git checkout -- src/shared/database/database.types.ts`.
- Prohibido salvo que el usuario lo pida: `db reset --remote`, `db push --include-seed`, `migration repair`.
- No hagas commit de `supabase/.temp/`, `supabase/.branches/`, `.env*`, claves ni volcados de datos reales.

## Anti-pausa (plan Free)

Hay dos piezas: la función `public.keepalive()`, ejecutable solo por `anon`, y el workflow `.github/workflows/supabase-keepalive.yml`, que la llama 3 veces al día. Necesita los secrets `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`, y que el repo sea **privado**: en repos públicos, GitHub desactiva los cron tras 60 días sin actividad.

## Avisos de herramientas

Lo que hacen las herramientas y no se espera: no son fallos del código del proyecto. Cuando algo falle por la herramienta, añade aquí qué pasa y cómo evitarlo.

### Supabase local (Docker en Windows)

- `pnpm supabase:db:reset:local` puede terminar con `Error status 502` **después** de `Restarting containers...`. Eso es la salud de Storage o Kong al reiniciar, no la migración. Si las migraciones aparecen como `Applying migration ...` sin error, la base está bien.
- Si después la API sigue en 502: `pnpm supabase:stop`, luego `pnpm supabase:start`.
- El contenedor `vector` (logs) entra en bucle de reinicios porque no alcanza el daemon de Docker. Si bloquea `supabase start` por conflicto de nombre, elimina solo ese contenedor: `docker rm -f supabase_vector_research_lab`.
- El reset borra los datos importados y el usuario de prueba. Recrea el usuario con la API de administración local (ver README) y vuelve a importar con `research/chocolate/import.mjs`, las etiquetas y las correcciones de `research/chocolate/fixes/`.

### Supabase hosted (configuración de Auth)

- `supabase config push` envía **todo** lo que declara `config.toml`, y este tiene valores de local: `site_url` con localhost, frecuencia de emails, longitud del OTP, MFA y tamaño del pool. Nunca lo empujes tal cual. Usa un `config.toml` mínimo, con solo lo que quieres cambiar, en otra carpeta con `--workdir`, y revisa antes `supabase config diff`. Lo que el archivo no declara queda igual en hosted.
- El CLI no sincroniza las passkeys (`[auth.passkey]` ni `[auth.webauthn]`): van por la API de gestión (`PATCH /v1/projects/<ref>/config/auth` con `passkey_enabled` y `webauthn_rp_*`).
- Cambiar el RP ID de las passkeys invalida todas las registradas.

### Vercel CLI

- `vercel link` escribe un `VERCEL_OIDC_TOKEN` en `.env.local` y repite líneas en `.gitignore`. Copia `.env.local` antes, restáurala después y revisa el diff del `.gitignore`.
- `vercel env add` pide confirmación con los nombres que parecen secretos (`…KEY`), aunque no haya terminal. Usa `--type config --value <valor> --yes` para valores públicos (`NEXT_PUBLIC_*`) y `--type secret` para los privados.
- Las variables `NEXT_PUBLIC_*` se incrustan al compilar: tras cambiarlas, hace falta un despliegue nuevo.
- Crear un proyecto desde el CLI lo deja con el preset "Other". El framework se fija en `vercel.json`.

### Turnstile y navegadores automatizados

- En modo "Managed", Turnstile no entrega token a un navegador automatizado. `pnpm test:e2e` solo funciona en local, con las claves de prueba de Cloudflare. En producción, comprueba que el widget se pinte sin error de dominio; la entrada real la hace una persona.
- `puppeteer.launch()` no arranca Edge en este Windows. Lanza el navegador con `--remote-debugging-port=0` y conéctate leyendo el puerto de `DevToolsActivePort` (ver `e2e/smoke.mjs`).

### Terminales en Windows

- Git Bash convierte en ruta de Windows cualquier argumento que empiece por `/`: `curl -w "/login"` imprime `C:/Program Files/Git/login`. Evita empezar así o usa `MSYS_NO_PATHCONV=1`.
- PowerShell 5.1 parte los argumentos con comillas de los programas nativos: un `git commit -m` de varias líneas falla. Escribe el mensaje en un archivo y usa `git commit -F <archivo>`.
- Parar `pnpm start` matando solo el proceso de pnpm deja vivo `next start` en el puerto 3000: el siguiente `pnpm start` falla con `EADDRINUSE` y la e2e prueba la compilación anterior. Para el proceso que escucha en el 3000 (`Get-NetTCPConnection -LocalPort 3000 -State Listen`, luego `Stop-Process` con su `OwningProcess`).
- Con `core.autocrlf=true`, Git convierte a CRLF al hacer checkout. El SHA-256 de un archivo clonado no coincide con el publicado: calcúlalo sobre `git show HEAD:<ruta>`.

### PostgreSQL

- Una función que escribe, llamada en un `WHERE` (`where id = f()`), se ejecuta una vez por fila. En los tests, llámala una sola vez con `select set_config('test.x', f()::text, true)` y lee `current_setting('test.x')` (ver `supabase/tests/domain_rules.sql`).
