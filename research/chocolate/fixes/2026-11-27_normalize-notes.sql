-- Normalizes the notes written before the exception-note convention (docs/database-design.md,
-- "Notas de excepción"). Run with research/run-as-owner.mjs. Each update finds the row by its
-- natural key plus the current text, and checks how many rows it touched; any mismatch aborts all.
-- Also drops notes that became stale (Parmalat price, Valor 0% label check).

-- Experiments: the date is the report date.
update public.experiments
set conditions = replace(conditions, 'Fecha de reporte, no de ejecución exacta.', 'Observación: la fecha es la del reporte, no la de ejecución exacta.')
where starts_with(conditions, 'Fecha de reporte, no de ejecución exacta.');
get diagnostics n = row_count; if n <> 5 then raise exception 'experiments: % rows', n; end if;

-- Milk in every recipe.
update public.formulation_ingredients
set notes = 'Confirmado por el usuario: leche habitual (Parmalat semidescremada de 1000 ml).'
where notes = 'Leche habitual confirmada por el usuario.';
get diagnostics n = row_count; if n <> 16 then raise exception 'milk: % rows', n; end if;

-- Recipes.
update public.formulations set notes = 'Intensidad insuficiente. Pendiente: cantidad de maicena; que no figure en la receta no significa que fuera cero.'
where code = 'F02' and starts_with(notes, 'Intensidad insuficiente; cantidad de maicena');
get diagnostics n = row_count; if n <> 1 then raise exception 'F02: % rows', n; end if;

update public.formulations set notes = 'Se incrementó el chocolate por intensidad. Pendiente: el resultado final de sabor no se cuantificó.'
where code = 'F03' and starts_with(notes, 'Se incrementó chocolate por intensidad');
get diagnostics n = row_count; if n <> 1 then raise exception 'F03: % rows', n; end if;

update public.formulations set notes = 'Observación: después se reportó preferencia por Munné con el Valor anterior, pero eso no confirma esta receta exacta. La versión de 500 ml duplica las cantidades.'
where code = 'F04' and starts_with(notes, 'Se reportó después preferencia por Munné');
get diagnostics n = row_count; if n <> 1 then raise exception 'F04: % rows', n; end if;

update public.formulations set notes = 'Confirmado por el usuario: es la referencia actual. Sin maicena.'
where code = 'F05' and starts_with(notes, 'Referencia actual confirmada por usuario');
get diagnostics n = row_count; if n <> 1 then raise exception 'F05: % rows', n; end if;

update public.formulations set notes = 'Variante indicada por el usuario para compensar el espesor. Pendiente: resultado no confirmado.'
where code = 'F06' and starts_with(notes, 'Variante indicada por usuario');
get diagnostics n = row_count; if n <> 1 then raise exception 'F06: % rows', n; end if;

update public.formulations set notes = 'Observación: la preferencia general por Munné no valida esta dosis exacta.'
where code = 'F07' and starts_with(notes, 'Preferencia general por Munné');
get diagnostics n = row_count; if n <> 1 then raise exception 'F07: % rows', n; end if;

update public.formulations set notes = 'Pendiente: endulzante adicional por determinar. Alias histórico: Prueba C.'
where code = 'F12' and starts_with(notes, 'Endulzante adicional por determinar');
get diagnostics n = row_count; if n <> 1 then raise exception 'F12: % rows', n; end if;

update public.formulations set notes = 'Pendiente: endulzante por determinar. Objetivo: bebida, no repostería. Alias histórico: Prueba D.'
where code = 'F13' and starts_with(notes, 'Endulzante por determinar');
get diagnostics n = row_count; if n <> 1 then raise exception 'F13: % rows', n; end if;

update public.formulations set notes = 'Pendiente: base exacta inferida del contexto, por confirmar. Observación: 0.8 g de canela se percibieron como la expectativa de 0.5 g. Alias histórico: C01.'
where code = 'F14' and starts_with(notes, 'Base exacta inferida de contexto');
get diagnostics n = row_count; if n <> 1 then raise exception 'F14: % rows', n; end if;

-- Finding K03 (its experiment E06 had no recipe).
update public.findings set statement = 'Munné es el potenciador preferido por intensidad y amargor; comparación no controlada. No importado: el experimento E06, sin receta (Munné añadió amargor e intensidad al Valor anterior; el usuario prefiere su aporte frente a Chocolala). Pendiente: tipo de Valor y dosis exacta de E06.'
where starts_with(statement, 'Munné es el potenciador preferido') and statement like '%Base: E06%';
get diagnostics n = row_count; if n <> 1 then raise exception 'K03: % rows', n; end if;

-- Hypothesis H06 (holds the former finding K07).
update public.hypotheses set rationale = 'Derivado: si la porción de Embajador fuera de 30 g, 52 g aportarían 31.2 g de azúcar y 26 g, 15.6 g. Pendiente: verificar la porción en la etiqueta.'
where starts_with(rationale, 'Embajador: si la porción fuera 30 g');
get diagnostics n = row_count; if n <> 1 then raise exception 'H06: % rows', n; end if;

-- Prices.
update public.product_prices pp set notes = 'Pendiente: peso; la ficha indica 2 Lb en otro campo. Observación: la página ofrece avisar cuando vuelva a stock.'
from public.products p where p.id = pp.product_id and p.name = 'Chocolala cacao en polvo' and starts_with(pp.notes, 'La ficha indica 2 Lb');
get diagnostics n = row_count; if n <> 1 then raise exception 'price Chocolala: % rows', n; end if;

update public.product_prices pp set notes = 'Observación: precio especial ese día 109.00; se registra el habitual.'
from public.products p where p.id = pp.product_id and p.name = 'Chocolate Embajador Cortés' and pp.notes = 'Precio habitual; precio especial ese día: 109.';
get diagnostics n = row_count; if n <> 1 then raise exception 'price Embajador: % rows', n; end if;

update public.product_prices pp set notes = 'Observación: Nacional lo lista como 7 oz. Confirmado por el usuario: el envase es de 200 g (foto de etiqueta del 2026-11-27).'
from public.products p where p.id = pp.product_id and p.name = 'Cocoa Amarga Líder' and starts_with(pp.notes, 'Nacional lo lista como 7 oz');
get diagnostics n = row_count; if n <> 1 then raise exception 'price Cocoa Líder: % rows', n; end if;

update public.product_prices pp set notes = 'Observación: precio especial ese día 122.00; se registra el habitual.'
from public.products p where p.id = pp.product_id and p.name = 'Maicena Duryea' and pp.notes = 'Precio habitual; precio especial ese día: 122.';
get diagnostics n = row_count; if n <> 1 then raise exception 'price Maicena: % rows', n; end if;

update public.product_prices pp set notes = 'Observación: precio especial ese día 79.95; se registra el habitual.'
from public.products p where p.id = pp.product_id and p.name = 'Parmalat semidescremada enriquecida' and pp.notes = 'Precio habitual; precio especial ese día: 79.95.';
get diagnostics n = row_count; if n <> 1 then raise exception 'price Parmalat: % rows', n; end if;

update public.product_prices pp set notes = 'Observación: la página ofrece avisar cuando vuelva a stock (agotado).'
from public.products p where p.id = pp.product_id and p.name = 'Valorcao a la Taza Negro Intenso' and pp.notes = 'La página ofrece avisar cuando vuelva a stock.';
get diagnostics n = row_count; if n <> 1 then raise exception 'price Valor Intenso: % rows', n; end if;

-- Products.
update public.products set notes = 'Ingredientes: 100% canela. Reg. Ind. 20032, Reg. Sanit. 52797. Referencia: nutrición de USDA FDC 171320, porque la etiqueta no tiene tabla (foto del 2026-11-27). Pendiente: especie botánica, contenido de cumarina (hipótesis H05) y si el envase usado es el de 80 g. ID export: P10.'
where name = 'Canela molida Líder' and starts_with(notes, 'Especie botánica y cumarina desconocidas');
get diagnostics n = row_count; if n <> 1 then raise exception 'product Canela: % rows', n; end if;

update public.products set notes = 'Pendiente: peso real; la ficha comercial dice media libra en el título y dos libras en otro campo. Pendiente: lote y vencimiento; una foto previa parecía indicar julio de 2024. ID export: P06.'
where name = 'Chocolala cacao en polvo' and starts_with(notes, 'Peso de ficha comercial provisional');
get diagnostics n = row_count; if n <> 1 then raise exception 'product Chocolala: % rows', n; end if;

update public.products set notes = 'Confirmado por el usuario: 10 tabletas de 26 g. Derivado: peso del paquete 260 g (10 × 26 g). No importado: nutrición de la conversación por una porción de 30 g no confirmada (azúcares 18 g, de ellos añadidos 18 g; grasa 4 g; saturada 3 g; carbohidratos 20 g; proteína máx. 1 g; sodio 30 mg). Pendiente: porción real de la etiqueta. ID export: P01.'
where name = 'Chocolate Embajador Cortés' and starts_with(notes, '10 tabletas de 26 g según usuario');
get diagnostics n = row_count; if n <> 1 then raise exception 'product Embajador: % rows', n; end if;

update public.products set notes = 'Cacao declarado: 100%. Ingredientes: 100% cocoa amarga. Fabricante: PanaPack S.A. (Panamá), para Centro Cuesta Nacional. Confirmado por el usuario: envase de 200 g (foto de etiqueta del 2026-11-27). Pendiente: alcalinización (ver la observación en la fuente de su etiqueta) y calidad sensorial. ID export: P07.'
where name = 'Cocoa Amarga Líder' and starts_with(notes, '100% cocoa amarga. PanaPack');
get diagnostics n = row_count; if n <> 1 then raise exception 'product Cocoa Líder: % rows', n; end if;

update public.products set notes = 'Ingredientes: fécula de maíz. Hecho en México (Unilever). Observación: el usuario fotografió esta etiqueta el 2026-11-27; antes la marca usada no estaba confirmada. ID export: P08.'
where name = 'Maicena Duryea' and starts_with(notes, 'Marca usada para referencia económica');
get diagnostics n = row_count; if n <> 1 then raise exception 'product Maicena: % rows', n; end if;

update public.products set notes = 'Ingredientes: cacao tratado con álcali (alcalinizado). Observación: preferido por intensidad y amargor, sin comparación ciega controlada. No importado: fibra 1 g por 5 g (transcripción histórica dudosa). ID export: P05.'
where name = 'Munné Cocoa Amarga' and starts_with(notes, 'Alcalinizado. Preferido');
get diagnostics n = row_count; if n <> 2 then raise exception 'product Munné: % rows', n; end if;

update public.products set notes = 'Confirmado por el usuario: es la leche habitual de todas las recetas. No importado: colesterol 15 mg por 250 ml (sin columna). Observación: la web de Nacional (2026-11-26) muestra 130 kcal y 5 g de grasa sin indicar porción; se conserva la etiqueta fotografiada. ID export: P09.'
where name = 'Parmalat semidescremada enriquecida' and starts_with(notes, 'Leche habitual confirmada por usuario.');
get diagnostics n = row_count; if n <> 1 then raise exception 'product Parmalat: % rows', n; end if;

update public.products set notes = 'Base preferida disponible; contiene maltitol. Cacao declarado: 20%. Ingredientes: maltitol, cacao desgrasado en polvo (20%), espesante, lecitina (parcialmente legibles en la foto). Etiqueta cotejada con foto del 2026-11-27 (ver su fuente). Máximo: azúcares < 0,5 g por 100 g, guardado como 0,5. No importado: azúcares añadidos 0 g (sin columna). ID export: P03.'
where name = 'Valorcao a la Taza 0% azúcares añadidos' and starts_with(notes, 'Base preferida disponible');
get diagnostics n = row_count; if n <> 1 then raise exception 'product Valor 0%%: % rows', n; end if;

update public.products set notes = 'Referencia sensorial superior. Confirmado por el usuario: no suele estar disponible. Cacao declarado: 30%. Ingredientes: azúcar, cacao desgrasado, almidón de maíz, lecitina de soja, aromas. Pendiente: ingredientes y nutrición vienen de una transcripción histórica, sin foto. ID export: P02.'
where name = 'Valorcao a la Taza Negro Intenso' and starts_with(notes, 'Referencia sensorial superior');
get diagnostics n = row_count; if n <> 1 then raise exception 'product Valor Intenso: % rows', n; end if;

update public.products set notes = 'Ficha comercial histórica; no equiparar con Intenso. Pendiente: presentación exacta (el usuario compara dos versiones de 200 g). ID export: P04.'
where name = 'Valorcao convencional' and starts_with(notes, 'Ficha comercial histórica');
get diagnostics n = row_count; if n <> 1 then raise exception 'product Valor convencional: % rows', n; end if;

-- Sources.
update public.sources
set notes = replace(replace(notes,
  'Referencia, no etiqueta: ', 'Referencia: no es dato de etiqueta; '),
  'USDA no indica la especie (Ceilán o cassia); la de Líder es desconocida (hipótesis H05).',
  'Pendiente: USDA no indica la especie (Ceilán o cassia) y la de Líder es desconocida (hipótesis H05).')
where kind = 'bibliographic' and starts_with(notes, 'Referencia, no etiqueta: ');
get diagnostics n = row_count; if n <> 1 then raise exception 'source USDA canela: % rows', n; end if;

update public.sources
set notes = replace(notes, 'La etiqueta no tiene tabla nutricional.', 'Observación: la etiqueta no tiene tabla nutricional.')
where title = 'Etiqueta: Canela molida Líder' and starts_with(notes, 'La etiqueta no tiene tabla nutricional.');
get diagnostics n = row_count; if n <> 1 then raise exception 'source label Canela: % rows', n; end if;

update public.sources
set notes = replace(notes, 'No se usa la columna de natilla preparada.', 'No importado: la columna de natilla preparada.')
where title = 'Etiqueta: Maicena Duryea' and notes like '%No se usa la columna de natilla preparada.%';
get diagnostics n = row_count; if n <> 1 then raise exception 'source label Maicena: % rows', n; end if;

update public.sources
set notes = replace(replace(replace(notes,
  'Azúcares declarados "<0,5 g": se guarda 0,5 como máximo', 'Máximo: azúcares declarados "<0,5 g", guardado como 0,5'),
  'Sodio 4 mg derivado de sal 0,01 g', 'Derivado: sodio 4 mg a partir de sal 0,01 g'),
  'Fibra no declarada.', 'Observación: la etiqueta no declara fibra.')
where title = 'Etiqueta: Valorcao a la Taza 0% azúcares añadidos' and notes like '%se guarda 0,5 como máximo%';
get diagnostics n = row_count; if n <> 1 then raise exception 'source label Valor 0%%: % rows', n; end if;

update public.sources
set notes = 'Confirmado por el usuario: F03 usa 8 g de maicena; la leche de todas las recetas es Parmalat semidescremada de 1000 ml; la porción es de 250 ml.'
where title = 'Confirmaciones del usuario al revisar la importación' and starts_with(notes, 'F03 usa 8 g de maicena');
get diagnostics n = row_count; if n <> 1 then raise exception 'source confirmations: % rows', n; end if;
