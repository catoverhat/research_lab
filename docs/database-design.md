# Diseño de la base de datos

Fuente de verdad: `supabase/migrations/`. Este documento explica el porqué; el SQL manda.

## Diagrama entidad-relación

```mermaid
erDiagram
  RESEARCH_PROJECTS ||--o{ FORMULATIONS : contiene
  RESEARCH_PROJECTS ||--o{ HYPOTHESES : define
  RESEARCH_PROJECTS ||--o{ FINDINGS : concluye
  RESEARCH_PROJECTS ||--o{ RESEARCH_REPORTS : publica
  RESEARCH_PROJECTS ||--o{ SOURCES : cita
  INGREDIENTS ||--o{ PRODUCTS : clasifica
  PRODUCTS ||--o| PRODUCT_NUTRITION : describe
  PRODUCTS ||--o{ PRODUCT_PRICES : registra
  SUPPLIERS ||--o{ PRODUCT_PRICES : ofrece
  FORMULATIONS ||--o{ FORMULATION_INGREDIENTS : usa
  PRODUCTS ||--o{ FORMULATION_INGREDIENTS : aparece_en
  FORMULATIONS ||--o{ FORMULATIONS : version_de
  FORMULATIONS ||--o{ EXPERIMENTS : se_ejecuta_en
  HYPOTHESES ||--o{ EXPERIMENTS : pone_a_prueba
  EXPERIMENTS ||--o{ SENSORY_EVALUATIONS : mide
  HYPOTHESES ||--o{ FINDINGS : respalda
  EXPERIMENTS ||--o{ FINDINGS : evidencia
  SOURCES ||--o{ FINDINGS : sustenta
  SOURCES ||--o{ PRODUCT_PRICES : sustenta
  SOURCES ||--o{ PRODUCT_NUTRITION : sustenta
  PRODUCTS ||--o{ ATTACHMENTS : documenta
  EXPERIMENTS ||--o{ ATTACHMENTS : documenta
```

Todas las tablas tienen además `owner_id → auth.users` (omitido en el diagrama).

## Decisiones

| # | Decisión | Por qué |
|---|----------|---------|
| 1 | Cada fila lleva `owner_id` (por defecto `auth.uid()`), y las políticas comparan solo esa columna. | Políticas simples, sin joins y con índice. Cada usuario, también los anónimos, tiene su propio espacio aislado. |
| 2 | `ingredients` es la materia genérica (cacao). `products` es una presentación comercial concreta (Munné 16 oz ≠ Munné 5 oz). | Los precios y las etiquetas son de una presentación, no de la materia. |
| 3 | `formulation_ingredients.quantity` va en la unidad del producto (`g`, `ml` o `unit`). | Coste y nutrición salen sin tablas de conversión. Las tazas o cucharadas se convierten al registrar. |
| 4 | `product_prices` solo se añade: un precio nuevo es una fila nueva. | Así se conserva el historial. Un experimento se costea con el último precio observado **en o antes** de su fecha, sin guardar copias de precios. |
| 5 | Una formulación es una versión de receta: `(project_id, code, version)`, con `parent_id` apuntando a la versión anterior. | Separa la receta (F05) de sus ejecuciones. Se puede repetir F05 diez veces sin tocarla. |
| 6 | Un trigger congela los ingredientes de una formulación en cuanto tiene un experimento `completed` o `failed`. | Si se editara la receta, se reescribiría en silencio lo que se usó en los experimentos pasados. Para cambiarla se crea `version + 1`. El nombre, las notas y el estado siguen editables. |
| 7 | `sensory_evaluations` guarda una fila por evaluador y atributo, con un score de 0 a 10. El atributo es texto libre. | Sirve para cualquier receta (amargor en chocolate, salinidad en otra) sin cambiar el esquema. Por convención, `overall` es la nota global. |
| 8 | Hay tres ejes de evidencia: `experiments.status` (planificado o realizado), `hypotheses.status` y `findings.evidence_level` (`confirmed`, `preliminary`, `anecdotal`). | Separa lo comprobado, las hipótesis y lo pendiente. |
| 9 | La historia no se borra en cascada: un experimento bloquea el borrado de su formulación, y un ingrediente de receta bloquea el de su producto. Al borrar un usuario se borra todo lo suyo. | Para borrar un proyecto con experimentos hay que borrar antes esos experimentos a propósito. Lo normal es archivarlo (`status = 'archived'`). |
| 10 | Los adjuntos van en el bucket privado `attachments`, bajo la ruta `<uid>/...`. Un `check` obliga a que `attachments.storage_path` empiece por el `owner_id`. | Las políticas de Storage y los metadatos usan la misma regla de carpeta. |
| 11 | Claves naturales únicas: `ingredients(owner, name)`, `suppliers(owner, name)`, `products(owner, brand, name, package_size, unit)`, `formulations(project, code, version)`, `research_reports(project, version)`. | Permiten importar con upsert sin duplicar. |

## Vistas (todas `security_invoker = true`, así respetan el RLS de quien consulta)

| Vista | Resultado |
|-------|-----------|
| `v_price_history` | Cada precio con producto, proveedor y `unit_cost` (precio por g, ml o unidad) |
| `v_product_unit_cost` | Último precio y `unit_cost` por producto |
| `v_formulation_cost` | Coste de un lote y por ración a precios actuales, y `ingredients_without_price` |
| `v_formulation_nutrition` | Nutrición por ración (del lote completo si `servings` es null), y `ingredients_without_nutrition` |
| `v_experiment_summary` | Experimento con su coste a precios de su fecha, número de evaluaciones y `overall_score` |
| `v_sensory_comparison` | Media por formulación y atributo, solo de experimentos `completed` |
| `v_research_context` | Un JSON por proyecto con todo lo necesario para retomar la investigación |

Los contadores `ingredients_without_*` avisan cuando un coste o una nutrición es parcial. Un total parcial nunca se presenta como completo. En `v_formulation_nutrition`, cada nutriente es `null` si algún ingrediente no tiene ese dato (las etiquetas no siempre declaran fibra o sodio), y el contador indica los ingredientes sin ficha nutricional.

## Exportar el contexto de una investigación

```sql
select context from public.v_research_context where project_id = '<uuid>';
```

Por REST, con la sesión del dueño:

```
GET /rest/v1/v_research_context?project_id=eq.<uuid>&select=context
```

El JSON incluye: el proyecto, las hipótesis, los hallazgos, las formulaciones (con ingredientes, coste y nutrición), los experimentos (con coste y evaluaciones), los productos usados (con etiqueta e historial de precios) y las fuentes. No incluye los adjuntos binarios ni los informes. Se puede pegar en una conversación nueva con una IA.

## Seguridad

- Las 15 tablas tienen RLS activado, `revoke all from anon, authenticated`, `grant select, insert, update, delete to authenticated` y cuatro políticas (`select`, `insert`, `update` y `delete`) con `(select auth.uid()) = owner_id`.
- `owner_id` tiene índice en todas las tablas, y cada FK tiene un índice que la encabeza.
- Las vistas solo tienen `grant select to authenticated`. `anon` no ve nada salvo `public.keepalive()`.
- Las funciones son `security invoker` con `search_path = ''`. No hay ninguna `security definer`.
- Los tests están en `supabase/tests/research_core.sql`. Prueban accesos permitidos y denegados (otro usuario, `anon` y Storage), el bloqueo de formulaciones, los cálculos de las vistas y el borrado de un usuario.

## Importación de los datos históricos (fase 2)

Fuentes en `research/chocolate/raw-data/`:
- `chocolate_research_import_v1.5.json`: la exportación de la conversación de ChatGPT, tal como se entregó.
- `prices_2026-11-26.json`: precios verificados en la web de Supermercados Nacional, con su URL. Sustituyen a los de la conversación.

`research/chocolate/import.mjs <owner-uuid> <out.sql> [--dry-run]` genera un único bloque `do`, que se ejecuta con `pnpm exec supabase db query --file <out.sql>` (y `--remote --yes` para hosted):
- Entra como el usuario dueño (rol `authenticated` con sus claims): el RLS se aplica y `owner_id` sale de `auth.uid()`.
- Es una sola sentencia. Si falla un insert o una comprobación, no se guarda nada. Una segunda ejecución choca con las claves únicas y tampoco guarda nada.
- Antes de terminar comprueba los conteos y que el coste de cada receta en `v_formulation_cost` coincida con el calculado desde el archivo de precios.
- `--dry-run` lo hace todo y termina con un error a propósito. Es la simulación para hosted.

Decisiones de mapeo, revisadas con el usuario el 2026-11-26. Están como constantes al principio del script:
- Una presentación por producto: Munné 5 oz y 16 oz son dos productos.
- Porción explícita: cada receta es 1 ración de 250 ml (`servings`, `serving_size`, `serving_unit`).
- Cantidades confirmadas por el usuario: F03 usa 8 g de maicena; la leche es siempre Parmalat semidescremada de 1000 ml.
- Sin dato fiable, `null` y nota en el producto: la nutrición de Embajador (porción no confirmada) y la fibra dudosa de Munné.
- Evidencia: lo observado o derivado es `preliminary`, y lo que la exportación declara no controlado es `anecdotal`. Nada es `confirmed`.
- Lo que no tiene tabla (metodología, seguridad, limitaciones y la lista de lo no importado) va en `research_reports` versión 1.
- No se importan: el experimento sin receta E06 (su observación va en un hallazgo), la leche entera Líder y las fotos, que no están disponibles.

### Etiquetas nutricionales

Las fotos van a `research/<tema>/labels/` y su transcripción, confirmada por el usuario, a `raw-data/labels_<fecha>.json`. `research/apply-labels.mjs` la aplica igual que la importación: una sola sentencia, como el dueño y con `--dry-run`. Cada etiqueta crea una fuente `label` y sustituye la ficha nutricional entera del producto.
- Los valores se guardan por la porción que declara la etiqueta (`basis_quantity`), sin conversiones.
- Un valor declarado como "< x" se guarda como x, con nota en la fuente. Los totales de las recetas quedan como máximo, nunca por debajo del real.
- Si la etiqueta declara sal y no sodio, el sodio se deriva como sal ÷ 2,5 (definición del Reglamento UE 1169/2011), con nota en la fuente.
- Si la etiqueta no tiene tabla nutricional (por ejemplo, especias "100 % canela"), se usan valores de una base de referencia oficial, como USDA FoodData Central. La entrada lleva `source` con `kind = 'bibliographic'`, título y URL, y una nota que dice "referencia, no etiqueta". La foto de la etiqueta sin tabla se guarda igual. Ejemplo: `raw-data/nutrition-references_2026-11-27.json`.

## Atajos conocidos

- `shortcut:` las vistas suman importes sin mirar la moneda (por defecto `DOP`). Cuando aparezca una segunda moneda, hay que agrupar por `currency`.
- Las FK no comprueban que la fila referenciada sea del mismo dueño. Un usuario podría referenciar el uuid de otro, pero no leerlo (el RLS lo impide y los uuid no se pueden adivinar). Si algún día hay datos compartidos, se pasaría a FK compuestas `(id, owner_id)`.
- Cada experimento pone a prueba como máximo una hipótesis (`experiments.hypothesis_id`). Si hace falta más, se añadiría una tabla puente.
- `formulations.servings` sigue editable después de congelar la receta. Cambiarlo altera el coste por ración de los experimentos pasados.
- Las formulaciones solo usan `products`. Un ingrediente sin marca, como el agua, se registra como producto sin precio.
