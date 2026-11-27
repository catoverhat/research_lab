# Requisitos

Plataforma de investigación gastronómica. El primer caso es la optimización del chocolate caliente estilo español.

## Funcionales

| ID | Requisito | Dónde se cubre |
|----|-----------|----------------|
| RF-01 | Registrar proyectos de investigación con objetivo, alcance y estado | `research_projects` |
| RF-02 | Catálogo de ingredientes genéricos y de productos comerciales (marca y presentación) | `ingredients`, `products` |
| RF-03 | Información nutricional normalizada por producto: de su etiqueta o, si la etiqueta no tiene tabla, de una base de referencia oficial, con la fuente indicada | `product_nutrition`, `sources` |
| RF-04 | Historial de precios y disponibilidad por proveedor | `product_prices`, `suppliers`, `v_price_history` |
| RF-05 | Formulaciones versionadas, separadas de sus ejecuciones | `formulations`, `formulation_ingredients` |
| RF-06 | Varias ejecuciones (experimentos) por formulación, planificadas o realizadas | `experiments` |
| RF-07 | Evaluación sensorial con atributos libres (sabor, intensidad, amargor, dulzor, textura, global) | `sensory_evaluations` |
| RF-08 | Hipótesis y hallazgos con nivel de evidencia y trazabilidad hasta su fuente o experimento | `hypotheses`, `findings`, `sources` |
| RF-09 | Adjuntar fotos, etiquetas, facturas y documentos | `attachments` y el bucket `attachments` |
| RF-10 | Versiones de informes científicos | `research_reports` |
| RF-11 | Costes por gramo/ml, por lote, por ración y por experimento, con el precio del día | vistas `v_*_cost`, `v_experiment_summary` |
| RF-12 | Comparaciones sensoriales y nutricionales entre formulaciones | `v_sensory_comparison`, `v_formulation_nutrition` |
| RF-13 | Exportar todo el contexto de un proyecto en JSON para una IA | `v_research_context` |
| RF-14 | Dashboard, CRUD, gráficas e informes PDF | Fases 3–6 (pendiente) |

## No funcionales

| ID | Requisito |
|----|-----------|
| RNF-01 | Genérico: estudiar otra receta no requiere cambiar el esquema |
| RNF-02 | Los datos derivados se calculan en vistas y no se guardan |
| RNF-03 | Cada usuario solo ve y modifica lo suyo (RLS en todas las tablas) |
| RNF-04 | La historia es inmutable: los precios solo se añaden y las recetas probadas se congelan |
| RNF-05 | No se inventa información experimental. Lo desconocido queda `null` |
| RNF-06 | Los cambios de esquema van solo en migraciones SQL versionadas, siempre hacia adelante |
| RNF-07 | Cabe en el plan Free de Supabase. Un keepalive evita la pausa por inactividad |
| RNF-08 | Ninguna dependencia que la fase actual no necesite |
