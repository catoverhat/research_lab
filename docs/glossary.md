# Glosario

Un término, un significado. La UI usa la columna "Término". El código y la base usan la columna "En la base". Si aparece un concepto nuevo, se añade aquí antes de usarlo.

## Núcleo común

| Término | En la base | Significado |
|---|---|---|
| Proyecto | `research_projects` | Una investigación con objetivo y alcance. Estados: planificado, activo, en pausa, terminado y archivado. Lo normal es archivarlo, no borrarlo |
| Módulo | — | Lo propio de un tipo de investigación (alimentos ahora, compras en el futuro). El resto es el núcleo común. Ver `architecture.md` |
| Ingrediente | `ingredients` | La materia genérica: cacao, leche, azúcar. No tiene precio ni etiqueta |
| Producto | `products` | Una presentación comercial concreta de un ingrediente: marca, nombre, tamaño del envase y unidad. Munné 5 oz y Munné 16 oz son dos productos |
| Unidad | `products.unit` | `g`, `ml` o `unit` (en la UI, "ud."). Las cantidades de las recetas van siempre en la unidad del producto |
| Producto en uso | — | El que tiene precios o aparece en alguna receta. Su tamaño y su unidad ya no cambian: otra presentación es otro producto |
| Proveedor | `suppliers` | Dónde se compra o se vio el precio: un supermercado, una tienda en línea |
| Precio | `product_prices` | Una observación del precio de un producto en una fecha. Solo se añade; nunca se edita. Por ahora, siempre en DOP |
| Fuente | `sources` | De dónde sale un dato: bibliográfica, comercial (la página de un precio), etiqueta, observación u otra |
| Ficha nutricional | `product_nutrition` | Los valores de la etiqueta (o de una referencia oficial) por la porción que declara (`basis_quantity`) |
| Nota de excepción | `notes` | Lo que no siguió el proceso normal. Empieza con una etiqueta: `Referencia:`, `Derivado:`, `Máximo:`, `Confirmado por el usuario:`, `No importado:`, `Observación:` o `Pendiente:` |
| Hipótesis | `hypotheses` | Lo que se cree y se quiere poner a prueba. Estados: pendiente, en prueba, respaldada, refutada e inconclusa |
| Hallazgo | `findings` | Lo que se concluyó, con su nivel de evidencia |
| Nivel de evidencia | `findings.evidence_level` | Confirmado (comprobado), preliminar (observado o derivado, sin confirmar) y anecdótico (no controlado) |
| Adjunto | `attachments` | Una foto, etiqueta, factura o documento guardado en Storage |
| Informe | `research_reports` | Una versión numerada del informe de un proyecto, en Markdown |
| Desconocido | `null` | Lo que no se sabe. Se muestra como "—" y nunca como 0 |
| Parcial | `ingredients_without_*` | Un total al que le falta algún dato (precio o nutrición). Siempre se dice: "faltan 2 precios" |

## Módulo de alimentos

| Término | En la base | Significado |
|---|---|---|
| Receta | `formulations` | Una versión de una receta: código (F05), versión (v1, v2…) y composición. En el código se llama *formulation*; en la UI, siempre "receta" |
| Versión nueva | `formulations.version`, `parent_id` | La copia de una receta con su versión siguiente, para cambiarla sin tocar la anterior. Empieza como borrador |
| Composición | `formulation_ingredients` | Qué productos lleva una receta y en qué cantidad (en la unidad del producto). Sus notas son anotaciones, no composición |
| Ración | `servings`, `serving_size`, `serving_unit` | Cuántas raciones da el lote y de qué tamaño (por ejemplo, 1 ración de 250 ml) |
| Lote | — | Todo lo que sale de preparar una receta una vez. El coste "por lote" es el de todos sus ingredientes |
| Estado de la receta | `formulations.status` | Borrador, propuesta, probada, validada y descartada. Es una etiqueta de trabajo: no congela nada |
| Experimento | `experiments` | Una ejecución de una receta en una fecha, con sus condiciones y observaciones. Una receta puede tener muchos |
| Planificado | `status = 'planned'` | Experimento que aún no se hizo. Puede no tener fecha |
| Realizado / fallido | `status = 'completed'` / `'failed'` | Experimento registrado: ya es historia. Necesita fecha y no vuelve a planificado ni a cancelado; si se registró por error, se borra |
| Congelada | — | Receta con al menos un experimento realizado o fallido. Su composición ya no cambia; para cambiarla, versión nueva |
| Evaluación sensorial | `sensory_evaluations` | Una puntuación de 0 a 10 por evaluador y atributo (amargor, dulzor, textura…). `overall` es la nota global |
| Coste a precios de su fecha | `v_experiment_summary` | El coste de un experimento con el último precio visto en su fecha o antes. Los precios posteriores no lo cambian |
