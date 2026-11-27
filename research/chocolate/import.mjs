// Builds the SQL that imports the chocolate research (phase 2) in one transaction, as the owner
// user through RLS. The SQL checks its own result against the views before committing.
//
//   node research/chocolate/import.mjs <owner-uuid> <out.sql> [--dry-run]
//   pnpm exec supabase db query --file <out.sql>                   (local)
//   pnpm exec supabase db query --file <out.sql> --remote --yes    (hosted, after approval)
//
// --dry-run ends in ROLLBACK: the whole import and its checks run, nothing is kept.
// Mapping decisions are documented in docs/database-design.md (Importación) and below.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const [owner, outPath, mode] = process.argv.slice(2);
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(owner ?? '') || !outPath) {
  throw new Error('usage: node research/chocolate/import.mjs <owner-uuid> <out.sql> [--dry-run]');
}
const read = (name) => JSON.parse(readFileSync(new URL(`./raw-data/${name}`, import.meta.url), 'utf8'));
const d = read('chocolate_research_import_v1.5.json');
const priced = read('prices_2026-11-26.json');

// --- Decisions (user review, 2026-11-26) -----------------------------------------------------
const SERVING = { servings: 1, serving_size: 250, serving_unit: 'ml' }; // one 250 ml cup per recipe
const QUANTITY_OVERRIDES = { 'F03/P08': 8 }; // user confirmed 8 g (export said 8-10 g)
const SKIP_PRODUCTS = { P11: 'referencia económica descartada, sin receta ni precio verificable' };
const SKIP_NUTRITION = { P01: 'la porción de 30 g no está confirmada' };
const DROP_NUTRIENTS = { P05: { fiber_g: 'transcripción histórica dudosa' } };
const PRODUCT_NOTES = {
  P09: 'La web de Nacional (2026-11-26) muestra 130 kcal y 5 g de grasa sin indicar porción; se conserva la etiqueta fotografiada.',
};
const FORMULATION_STATUS = {
  tested_satisfactory: 'validated', tested_unsatisfactory: 'discarded',
  tested: 'tested', tested_preliminary: 'tested', proposed: 'proposed',
};
const EXPERIMENT_STATUS = { reported: 'completed' };
const EVIDENCE = { observed: 'preliminary', derived: 'preliminary' };
const EVIDENCE_OVERRIDES = { K03: 'anecdotal' }; // the export itself says "comparación no controlada"
const FINDINGS_TO_SCOPE = ['K05', 'K08']; // protocol facts, not research evidence
const FINDINGS_TO_HYPOTHESIS = { K07: 'H06' }; // conditional calculation: belongs to "verify Embajador portion"
const SOURCE_KIND = {
  conversation: 'observation', catalog: 'commercial', literature: 'bibliographic',
  regulatory: 'bibliographic', report: 'other',
};
const CATEGORY_INGREDIENT = {
  chocolate_de_mesa: 'Chocolate de mesa', preparado: 'Preparado de chocolate a la taza',
  cacao: 'Cacao en polvo', espesante: 'Fécula de maíz', leche: 'Leche', especia: 'Canela molida',
};
const NUTRIENT_COLUMNS = ['energy_kcal', 'fat_g', 'saturated_fat_g', 'carbohydrates_g', 'sugars_g', 'fiber_g', 'protein_g', 'sodium_mg'];

// --- SQL helpers ------------------------------------------------------------------------------
const fail = (msg) => { throw new Error(msg); };
const lit = (v) => {
  if (v == null) return 'null';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : fail(`bad number ${v}`);
  if (typeof v === 'boolean') return String(v);
  return `'${String(v).replaceAll("'", "''")}'`;
};
const sql = [];
const counts = {};
const insert = (table, row) => {
  const cols = Object.keys(row).filter((k) => row[k] !== undefined);
  sql.push(`insert into public.${table} (${cols.join(', ')}) values (${cols.map((k) => lit(row[k])).join(', ')});`);
  counts[table] = (counts[table] ?? 0) + 1;
  return row.id;
};
const text = (...parts) => parts.filter(Boolean).join(' ') || null;
const kv = (obj) => Object.entries(obj).map(([k, v]) => `${k}=${v}`).join(', ');
const byId = (arr) => new Map(arr.map((x) => [x.id, x]));
const P = byId(d.products), PR = byId(d.product_prices), K = byId(d.findings);

// --- Project and sources ----------------------------------------------------------------------
const projectId = randomUUID();
insert('research_projects', {
  id: projectId,
  title: d.project.title,
  status: d.project.status,
  objective: d.project.objectives.join('; '),
  scope: text(
    d.methodology.design,
    `Control: ${d.project.control.milk_ml} ml de leche ${P.get(d.project.control.milk_product_id).name} por taza.`,
    `Referencia sensorial: ${d.project.sensory_reference_id}. Formulación validada actual: ${d.project.current_validated_formulation_id}.`,
    ...FINDINGS_TO_SCOPE.map((k) => K.get(k).statement),
  ),
});

const sourceId = {};
for (const s of d.sources) {
  sourceId[s.id] = insert('sources', {
    id: randomUUID(), project_id: projectId,
    kind: SOURCE_KIND[s.type] ?? fail(`source kind ${s.type}`),
    title: s.description, url: s.url ?? null,
    notes: text(s.filename && `Archivo: ${s.filename}.`, `ID export: ${s.id}.`),
  });
}
sourceId.USER = insert('sources', {
  id: randomUUID(), project_id: projectId, kind: 'observation',
  title: 'Confirmaciones del usuario al revisar la importación', accessed_on: priced.observed_on,
  notes: 'F03 usa 8 g de maicena. La leche de todas las recetas es Parmalat semidescremada de 1000 ml. Porción: 250 ml.',
});

// --- Catalog ----------------------------------------------------------------------------------
const supplierId = {};
for (const s of d.suppliers) {
  supplierId[s.id] = insert('suppliers', {
    id: randomUUID(), name: s.name, kind: 'supermarket', location: s.country, url: s.website, notes: `ID export: ${s.id}.`,
  });
}

const ingredientId = {};
for (const category of new Set(d.products.filter((p) => !SKIP_PRODUCTS[p.id]).map((p) => p.category))) {
  ingredientId[category] = insert('ingredients', {
    id: randomUUID(), name: CATEGORY_INGREDIENT[category] ?? fail(`category ${category}`), category,
  });
}

// One product per presentation; a product without package size takes the sizes of its prices.
const productId = {};
const key = (pid, size) => `${pid}@${size}`;
for (const p of d.products) {
  if (SKIP_PRODUCTS[p.id]) continue;
  const sizes = p.package_quantity != null ? [p.package_quantity]
    : [...new Set(d.product_prices.filter((r) => r.product_id === p.id).map((r) => r.package_quantity))];
  if (!sizes.length) fail(`${p.id}: no package size`);
  const n = p.nutrition ?? {};
  const extras = Object.fromEntries(Object.entries(n).filter(([k]) => !NUTRIENT_COLUMNS.includes(k) && !['basis_g', 'basis_ml'].includes(k)));
  const dropped = DROP_NUTRIENTS[p.id] ?? {};
  const notes = text(
    p.notes,
    p.cocoa_percent_declared != null && `Cacao declarado: ${p.cocoa_percent_declared}%.`,
    p.ingredients && `Ingredientes: ${p.ingredients}.`,
    SKIP_NUTRITION[p.id] && `Nutrición no importada (${SKIP_NUTRITION[p.id]}): ${kv(n)}.`,
    !SKIP_NUTRITION[p.id] && Object.keys(extras).length && `Datos de etiqueta sin columna: ${kv(extras)}.`,
    ...Object.entries(dropped).map(([k, why]) => `${k}=${n[k]} no importado (${why}).`),
    PRODUCT_NOTES[p.id],
    `ID export: ${p.id}.`,
  );
  for (const size of sizes) {
    const id = insert('products', {
      id: randomUUID(), ingredient_id: ingredientId[p.category], name: p.name,
      package_size: size, unit: p.package_unit, notes,
    });
    productId[key(p.id, size)] = id;
    if (!p.nutrition || SKIP_NUTRITION[p.id]) continue;
    const row = {
      product_id: id, basis_quantity: n.basis_g ?? n.basis_ml ?? fail(`${p.id}: nutrition without basis`),
      source_id: sourceId.SRC01,
    };
    for (const c of NUTRIENT_COLUMNS) if (n[c] != null && !(c in dropped)) row[c] = n[c];
    insert('product_nutrition', row);
  }
}

// Verified prices replace the unverified ones from the conversation (append-only from here on).
const unitCost = {};
for (const r of priced.prices) {
  const pid = productId[key(r.product_id, r.package_quantity)] ?? fail(`price for unknown presentation ${key(r.product_id, r.package_quantity)}`);
  if (P.get(r.product_id).package_unit !== r.package_unit) fail(`${r.product_id}: price unit ${r.package_unit}`);
  const src = insert('sources', {
    id: randomUUID(), project_id: projectId, kind: 'commercial',
    title: `${d.suppliers.find((s) => s.id === priced.supplier_id).name}: ${r.title}`, url: r.url, accessed_on: priced.observed_on,
  });
  insert('product_prices', {
    id: randomUUID(), product_id: pid, supplier_id: supplierId[priced.supplier_id],
    price: r.price, currency: priced.currency, observed_on: priced.observed_on, in_stock: r.in_stock, source_id: src,
    notes: text(r.special_price != null && `Precio habitual; precio especial ese día: ${r.special_price}.`, r.notes),
  });
  unitCost[pid] = r.price / r.package_quantity;
}

// --- Formulations, experiments, knowledge -----------------------------------------------------
const formulationId = {};
const expectedCost = {};
for (const f of d.formulations) {
  formulationId[f.id] = insert('formulations', {
    id: randomUUID(), project_id: projectId, code: f.id, version: 1, name: f.name,
    status: FORMULATION_STATUS[f.status] ?? fail(`${f.id}: status ${f.status}`), ...SERVING,
    notes: text(f.notes, f.historical_alias && `Alias histórico: ${f.historical_alias}.`),
  });
  expectedCost[f.id] = 0;
  for (const i of f.ingredients) {
    const size = P.get(i.product_id).package_quantity ?? PR.get(i.reference_price_id)?.package_quantity;
    const pid = productId[key(i.product_id, size)] ?? fail(`${f.id}: no product ${key(i.product_id, size)}`);
    const override = QUANTITY_OVERRIDES[`${f.id}/${i.product_id}`];
    const quantity = i.quantity ?? override ?? fail(`${f.id}/${i.product_id}: quantity unknown`);
    insert('formulation_ingredients', {
      id: randomUUID(), formulation_id: formulationId[f.id], product_id: pid, quantity,
      notes: text(
        i.quantity_status === 'habitual_milk_assumed_for_historical_runs' && 'Leche habitual confirmada por el usuario.',
        override != null && `Confirmado por el usuario: ${override} ${i.unit} (la exportación decía ${i.quantity_min}–${i.quantity_max} ${i.unit}).`,
      ),
    });
    expectedCost[f.id] += quantity * (unitCost[pid] ?? fail(`${f.id}: ${i.product_id} has no price`));
  }
}

const experimentId = {};
const skipped = [];
for (const e of d.experiments) {
  if (!e.formulation_id) { skipped.push(`${e.id} (sin receta): ${e.observations}`); continue; }
  experimentId[e.id] = insert('experiments', {
    id: randomUUID(), formulation_id: formulationId[e.formulation_id],
    status: EXPERIMENT_STATUS[e.status] ?? fail(`${e.id}: status ${e.status}`), performed_on: e.performed_on,
    conditions: `Fecha de reporte, no de ejecución exacta. ID export: ${e.id}.`, observations: e.observations,
  });
}

const hypothesisNotes = {};
for (const [k, h] of Object.entries(FINDINGS_TO_HYPOTHESIS)) hypothesisNotes[h] = K.get(k).statement;
for (const k of d.findings) {
  if (FINDINGS_TO_SCOPE.includes(k.id) || FINDINGS_TO_HYPOTHESIS[k.id]) continue;
  const eid = k.experiment_ids[0];
  insert('findings', {
    id: randomUUID(), project_id: projectId,
    statement: text(k.statement, eid && !experimentId[eid] && `Base: ${skipped.find((s) => s.startsWith(eid))}`),
    evidence_level: EVIDENCE_OVERRIDES[k.id] ?? EVIDENCE[k.status] ?? fail(`${k.id}: status ${k.status}`),
    experiment_id: experimentId[eid] ?? null,
    source_id: k.status === 'derived' ? sourceId.SRC02 : sourceId.SRC01,
  });
}
for (const h of d.hypotheses) {
  insert('hypotheses', {
    id: randomUUID(), project_id: projectId, statement: h.description, status: h.status,
    rationale: text(h.formulation_ids.length > 0 && `Formulaciones: ${h.formulation_ids.join(', ')}.`, hypothesisNotes[h.id]),
  });
}

const m = d.methodology;
insert('research_reports', {
  id: randomUUID(), project_id: projectId, version: 1,
  title: `Metodología, seguridad y limitaciones (exportación v${d.research_version})`,
  content_md: [
    `# Metodología, seguridad y limitaciones`, ``,
    `Fuente: exportación de la conversación v${d.research_version} (${d.exported_on}).`, ``,
    `## Diseño`, ``, m.design, ``,
    `## Preparación de referencia`, ``, ...m.preparation_reference.map((s, i) => `${i + 1}. ${s}`), ``,
    `## Dimensiones sensoriales`, ``, ...m.sensory_dimensions.map((s) => `- ${s}`), ``,
    `## Escala (${m.scale.status})`, ``, `${m.scale.min}–${m.scale.max}. ${m.scale.note}`, ``,
    `## Índice de calidad (${m.quality_index.status})`, ``,
    ...Object.entries(m.quality_index.weights_percent).map(([k, v]) => `- ${k}: ${v} %`), ``,
    `## Notas de seguridad`, ``, ...d.safety_notes.map((s) => `- **${s.topic}**: ${s.statement}`), ``,
    `## Limitaciones`, ``, ...d.limitations.map((s) => `- ${s}`), ``,
    `## No importado`, ``,
    ...skipped.map((s) => `- Experimento ${s}`),
    ...Object.entries(SKIP_PRODUCTS).map(([id, why]) => `- Producto ${id}: ${why}.`),
    `- ${d.attachments.length} fotografías: los archivos no están disponibles.`,
    `- Precios de la conversación: sustituidos por precios verificados el ${priced.observed_on}.`,
  ].join('\n'),
});

// --- Self-check inside the transaction ---------------------------------------------------------
const pidLit = lit(projectId);
const checks = [
  [`(select count(*) from public.formulations where project_id = ${pidLit})`, counts.formulations],
  [`(select count(*) from public.formulation_ingredients fi join public.formulations f on f.id = fi.formulation_id where f.project_id = ${pidLit})`, counts.formulation_ingredients],
  [`(select count(*) from public.experiments e join public.formulations f on f.id = e.formulation_id where f.project_id = ${pidLit} and e.status = 'completed')`, counts.experiments],
  [`(select count(*) from public.findings where project_id = ${pidLit})`, counts.findings],
  [`(select count(*) from public.hypotheses where project_id = ${pidLit})`, counts.hypotheses],
  // The view (numeric) must match the cost computed here (float) from the price file.
  ...Object.entries(expectedCost).map(([code, cost]) => [
    `(select abs(total_cost - ${cost}) < 0.000001 from public.v_formulation_cost where project_id = ${pidLit} and code = ${lit(code)} and ingredients_without_price = 0)`,
    true,
  ]),
];
const checkSql = checks.map(([q, want]) =>
  `  if ${q} is distinct from ${want} then raise exception 'import check failed: % <> %', ${lit(q)}, ${want}; end if;`);

// One DO statement: `supabase db query` runs a single prepared statement, and a single statement
// is atomic, so any failed insert or check discards everything. A dry run ends by raising.
const summary = lit(JSON.stringify({ project_id: projectId, ...counts }));
const out = [
  `-- Generated by research/chocolate/import.mjs. Owner: ${owner}. Mode: ${mode === '--dry-run' ? 'dry run (rolled back)' : 'commit'}.`,
  'do $import$',
  'begin',
  `  perform set_config('role', 'authenticated', true);`,
  `  perform set_config('request.jwt.claims', ${lit(JSON.stringify({ sub: owner, role: 'authenticated' }))}, true);`,
  ...sql.map((s) => `  ${s}`),
  ...checkSql,
  mode === '--dry-run'
    ? `  raise exception 'DRY RUN OK, nothing saved: %', ${summary};`
    : `  raise notice 'imported: %', ${summary};`,
  'end',
  '$import$;',
  '',
].join('\n');
writeFileSync(outPath, out, 'utf8');
console.log(JSON.stringify({ project_id: projectId, mode: mode ?? 'commit', ...counts }));
