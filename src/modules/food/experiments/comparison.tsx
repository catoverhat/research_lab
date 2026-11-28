import Link from "next/link";
import { GroupedBars } from "@/shared/charts/grouped-bars";
import { maxSeries } from "@/shared/charts/palette";
import type { Tables } from "@/shared/database/database.types";
import { date, label, missing, money, num, productLabel, unitLabel } from "@/shared/format";
import { must, type Client } from "@/shared/supabase/server";
import { compositionMatrix, type Line } from "./report/compare";
import { experimentStatus } from "./schema";
import { attributeLabel, scaleNote } from "./sensory";

const nutrients = [
  ["energy_kcal", "Energía", "kcal"],
  ["fat_g", "Grasas", "g"],
  ["saturated_fat_g", "Saturadas", "g"],
  ["carbohydrates_g", "Carbohidratos", "g"],
  ["sugars_g", "Azúcares", "g"],
  ["fiber_g", "Fibra", "g"],
  ["protein_g", "Proteína", "g"],
  ["sodium_mg", "Sodio", "mg"],
] as const;

/** Side-by-side view of the selected runs of a project, in the order given. */
export async function Comparison({ supabase, projectId, runs }: { supabase: Client; projectId: string; runs: Tables<"v_experiment_summary">[] }) {
  if (runs.length < 2) return <p className="muted">Elige al menos dos experimentos de este proyecto.</p>;

  const ids = runs.map((r) => r.experiment_id);
  const formulationIds = [...new Set(runs.map((r) => r.formulation_id))];
  const [sensoryRes, linesRes, nutritionRes] = await Promise.all([
    supabase.from("v_experiment_sensory").select("*").in("experiment_id", ids),
    supabase
      .from("formulation_ingredients")
      .select("formulation_id, product_id, quantity, products(brand, name, package_size, unit)")
      .in("formulation_id", formulationIds),
    supabase.from("v_formulation_nutrition").select("*").in("formulation_id", formulationIds),
  ]);
  const sensory = must(sensoryRes);
  const lines = must(linesRes);
  const nutrition = must(nutritionRes);

  const key = (id: string) => `e${ids.indexOf(id)}`;
  const runName = (r: (typeof runs)[number]) => `${r.code} v${r.version} · ${date(r.performed_on, "sin fecha")}`;
  const stat = (id: string, attribute: string) => sensory.find((s) => s.experiment_id === id && s.attribute === attribute);

  const attributes = [...new Set(sensory.map((s) => s.attribute))].sort(
    (a, b) => Number(b === "overall") - Number(a === "overall") || a.localeCompare(b, "es"),
  );
  const charted = runs.slice(0, maxSeries);
  const sensoryChartRows = attributes.map((a) => ({
    label: attributeLabel(a),
    ...Object.fromEntries(charted.map((r) => [key(r.experiment_id), stat(r.experiment_id, a)?.avg_score ?? null])),
  }));

  const toLine = (l: (typeof lines)[number]): Line => ({
    productId: l.product_id,
    label: l.products ? productLabel(l.products) : l.product_id,
    unit: l.products?.unit ?? "",
    quantity: l.quantity,
  });
  const matrix = compositionMatrix(
    runs.map((r) => ({ key: key(r.experiment_id), lines: lines.filter((l) => l.formulation_id === r.formulation_id).map(toLine) })),
  );

  return (
    <div className="space-y-6">
      <section className="card" aria-labelledby="cmp-summary">
        <h2 id="cmp-summary">Cifras clave</h2>
        <div className="table-scroll">
          <table className="tabular-nums">
            <thead>
              <tr>
                <th>Experimento</th>
                <th>Estado</th>
                <th>Nota global (n = evaluadores)</th>
                <th>Coste por ración (precios de su fecha)</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const overall = stat(r.experiment_id, "overall");
                return (
                  <tr key={r.experiment_id}>
                    <td>
                      <Link href={`/projects/${projectId}/experiments/${r.experiment_id}`}>{runName(r)}</Link>
                    </td>
                    <td>{label(experimentStatus, r.status)}</td>
                    <td>
                      {overall
                        ? `${num(overall.avg_score, 1)} (n=${overall.evaluations}${(overall.evaluations ?? 0) >= 2 ? `, desv. ${num(overall.stddev_score, 2)}` : ""})`
                        : "—"}
                    </td>
                    <td>
                      {money(r.cost_per_serving)}
                      {!!r.ingredients_without_price && <span className="warning"> · {missing(r.ingredients_without_price, "precio")}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-labelledby="cmp-sensory">
        <h2 id="cmp-sensory">Evaluación sensorial</h2>
        {attributes.length === 0 ? (
          <p className="muted">Ninguno de estos experimentos tiene evaluaciones todavía.</p>
        ) : (
          <>
            <p className="muted">{scaleNote}</p>
            {runs.length > maxSeries && (
              <p role="status" className="warning">
                La gráfica muestra los {maxSeries} primeros experimentos; la tabla, los {runs.length}.
              </p>
            )}
            <GroupedBars
              caption="Media por atributo (0-10)"
              max={10}
              rows={sensoryChartRows}
              series={charted.map((r) => ({ key: key(r.experiment_id), label: runName(r) }))}
            />
            <div className="table-scroll">
              <table className="tabular-nums">
                <thead>
                  <tr>
                    <th>Atributo</th>
                    {runs.map((r) => (
                      <th key={r.experiment_id}>{runName(r)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attributes.map((a) => (
                    <tr key={a}>
                      <td>{attributeLabel(a)}</td>
                      {runs.map((r) => {
                        const s = stat(r.experiment_id, a);
                        return <td key={r.experiment_id}>{s ? `${num(s.avg_score, 1)} (n=${s.evaluations})` : "—"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="card" aria-labelledby="cmp-composition">
        <h2 id="cmp-composition">Composición</h2>
        <p className="muted">Las filas marcadas «Cambia» son las que difieren entre los experimentos.</p>
        <div className="table-scroll">
          <table className="tabular-nums">
            <thead>
              <tr>
                <th>Producto</th>
                {runs.map((r) => (
                  <th key={r.experiment_id}>{runName(r)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => {
                const values = runs.map((r) => row.quantities[key(r.experiment_id)]);
                const differs = new Set(values).size > 1;
                return (
                  <tr key={row.productId} className={differs ? "font-semibold" : undefined}>
                    <td>
                      {row.label}
                      {differs && <span className="badge ml-2 font-normal">Cambia</span>}
                    </td>
                    {values.map((v, i) => (
                      <td key={runs[i].experiment_id}>{v == null ? "—" : `${num(v)} ${unitLabel(row.unit)}`}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-labelledby="cmp-nutrition">
        <h2 id="cmp-nutrition">Nutrición por ración</h2>
        <p className="muted">«—»: a algún ingrediente le falta ese dato, así que no se suma.</p>
        <div className="table-scroll">
          <table className="tabular-nums">
            <thead>
              <tr>
                <th>
                  <span className="sr-only">Nutriente</span>
                </th>
                {runs.map((r) => (
                  <th key={r.experiment_id}>{runName(r)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nutrients.map(([k, name, unit]) => (
                <tr key={k}>
                  <th>{name}</th>
                  {runs.map((r) => {
                    const v = nutrition.find((n) => n.formulation_id === r.formulation_id)?.[k] ?? null;
                    return (
                      <td key={r.experiment_id}>
                        {num(v, 1)} {v != null && unit}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* A nutrient left blank means an ingredient lacks it: this row says how many. */}
              <tr>
                <th>Ingredientes sin ficha</th>
                {runs.map((r) => (
                  <td key={r.experiment_id}>
                    {num(nutrition.find((n) => n.formulation_id === r.formulation_id)?.ingredients_without_nutrition, 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
