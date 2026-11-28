import Link from "next/link";
import type { ReactNode } from "react";
import { evidenceLevel, hypothesisStatus } from "@/core/findings/schema";
import { DotScale } from "@/shared/charts/dot-scale";
import { date, label, missing, money, num, percent, productLabel, signed, text, unitLabel } from "@/shared/format";
import { experimentStatus, isRecorded } from "../schema";
import { attributeLabel } from "../sensory";
import { compositionDiff, delta, sensoryRows } from "./compare";
import type { ExperimentReport } from "./data";

type Run = ExperimentReport["summary"];

export const runLabel = (r: Run) =>
  `${r.code} v${r.version} · ${date(r.performed_on, "sin fecha")} · ${label(experimentStatus, r.status)}`;

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="card report-section" aria-labelledby={`section-${n}`}>
      <h2 id={`section-${n}`}>
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

const changeLabel = { changed: "Cambia", added: "Nuevo", removed: "Quitado", same: "Igual" };

export function HypothesisSection({ r }: { r: ExperimentReport }) {
  const h = r.hypothesis;
  return (
    <Section n={1} title="Objetivo e hipótesis">
      {h ? (
        <div className="space-y-1">
          <p className="border-l-4 border-amber-600 pl-3 text-base">{h.statement}</p>
          {h.rationale && <p className="muted whitespace-pre-line">{h.rationale}</p>}
        </div>
      ) : (
        <p className="muted">
          Este experimento no tiene una hipótesis vinculada.
          <span className="no-print"> Se elige en «Editar datos del experimento».</span>
        </p>
      )}
    </Section>
  );
}

export function DesignSection({ r, projectId }: { r: ExperimentReport; projectId: string }) {
  const diff = compositionDiff(r.currentLines, r.referenceLines);
  const isReplicate = r.reference !== null && diff.every((d) => d.change === "same");
  return (
    <Section n={2} title="Diseño">
      {r.reference ? (
        <p>
          Comparado con{" "}
          <Link href={`/projects/${projectId}/experiments/${r.reference.experiment_id}`}>{runLabel(r.reference)}</Link>.
        </p>
      ) : (
        <p className="muted">
          Sin referencia: los resultados no se comparan con un control.
          {r.suggestedReference && (
            <span className="no-print"> Sugerencia: {runLabel(r.suggestedReference)} (versión anterior de esta receta).</span>
          )}
        </p>
      )}
      {r.reference &&
        (isReplicate ? (
          <p>Misma receta que la referencia: es una réplica del experimento.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <caption className="pb-2 text-left text-sm text-stone-600">Qué cambia respecto a la referencia</caption>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Referencia</th>
                  <th>Este</th>
                  <th>Cambio</th>
                </tr>
              </thead>
              <tbody>
                {diff.map((d) => (
                  <tr key={d.productId} className={d.change === "same" ? "text-stone-500" : undefined}>
                    <td>{d.label}</td>
                    <td className="tabular-nums">{d.reference == null ? "—" : `${num(d.reference)} ${unitLabel(d.unit)}`}</td>
                    <td className="tabular-nums">{d.current == null ? "—" : `${num(d.current)} ${unitLabel(d.unit)}`}</td>
                    <td>
                      {d.change === "same" ? (
                        changeLabel.same
                      ) : (
                        <span className="badge">
                          {changeLabel[d.change]}
                          {d.change === "changed" && ` (${signed((d.current ?? 0) - (d.reference ?? 0))} ${unitLabel(d.unit)})`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </Section>
  );
}

/** Free text as written, or a plain "not recorded" (reads right on paper, unlike a lone dash). */
function Prose({ value, empty }: { value: string | null; empty: string }) {
  return value ? <p className="whitespace-pre-line">{value}</p> : <p className="muted">{empty}</p>;
}

export function MethodSection({ r, projectId }: { r: ExperimentReport; projectId: string }) {
  const f = r.formulation;
  return (
    <Section n={3} title="Materiales y método">
      {isRecorded(r.experiment.status) && (
        <p className="muted">
          La composición quedó congelada al registrar el experimento: un cambio se hace en una versión nueva de la receta.{" "}
          <Link href={`/projects/${projectId}/formulations/${f.id}`} className="no-print">
            Ver la receta
          </Link>
        </p>
      )}
      <div className="table-scroll">
        <table>
          <caption className="pb-2 text-left text-sm text-stone-600">
            Receta {f.code} v{f.version}
            {f.name && ` · ${f.name}`}
            {f.servings && ` · ${num(f.servings)} ${f.servings === 1 ? "ración" : "raciones"}`}
            {f.serving_size && ` de ${num(f.serving_size)} ${unitLabel(f.serving_unit)}`}
          </caption>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {r.composition.map((l) => (
              <tr key={l.product_id}>
                <td>{l.products ? productLabel(l.products) : "—"}</td>
                <td className="tabular-nums whitespace-nowrap">
                  {num(l.quantity)} {unitLabel(l.products?.unit)}
                </td>
                <td className="whitespace-pre-line">{text(l.notes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3>Preparación</h3>
        <Prose value={f.instructions} empty="No registrada." />
      </div>
      <div>
        <h3>Condiciones</h3>
        <Prose value={r.experiment.conditions} empty="No registradas." />
      </div>
    </Section>
  );
}

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

function Diff({
  current,
  reference,
  money: isMoney,
  unit,
  digits = 1,
}: {
  current: number | null;
  reference: number | null;
  money?: boolean;
  unit?: string;
  digits?: number;
}) {
  const d = delta(current, reference);
  if (!d) return <>—</>;
  const sign = d.abs < 0 ? "−" : d.abs > 0 ? "+" : "";
  const abs = isMoney ? `${sign}${money(Math.abs(d.abs))}` : `${signed(d.abs, digits)}${unit ? ` ${unit}` : ""}`;
  return (
    <>
      {abs}
      {d.pct != null && <span className="text-stone-600"> ({percent(d.pct)})</span>}
    </>
  );
}

const prices = (withoutPrice: number | null) => (withoutPrice ? missing(withoutPrice, "precio") : "Completos");

export function ResultsSection({ r, evaluationsTable }: { r: ExperimentReport; evaluationsTable: ReactNode }) {
  const rows = sensoryRows(r.sensory, r.referenceSensory);
  const ref = r.reference;
  const n = r.nutrition;
  const refLabel = ref ? `${ref.code} v${ref.version}, ${date(ref.performed_on, "sin fecha")}` : undefined;
  return (
    <Section n={4} title="Resultados">
      <div className="space-y-3">
        <h3>Evaluación sensorial (escala 0-10)</h3>
        {rows.length === 0 ? (
          <p className="muted">
            Sin evaluaciones todavía.
            <span className="no-print"> Se registran en «Registrar evaluación sensorial».</span>
          </p>
        ) : (
          <>
            <DotScale
              caption={`Media por atributo y rango de las notas${ref ? ", frente a la referencia" : ""}`}
              referenceLabel={refLabel}
              rows={rows.map((s) => ({ label: attributeLabel(s.attribute), value: s.avg, min: s.min, max: s.max, reference: s.reference }))}
            />
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Atributo</th>
                    <th>Evaluaciones</th>
                    <th>Media</th>
                    <th>Rango</th>
                    <th>Desv. típica</th>
                    {ref && <th>Referencia</th>}
                    {ref && <th>Diferencia</th>}
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {rows.map((s) => (
                    <tr key={s.attribute}>
                      <td>{attributeLabel(s.attribute)}</td>
                      <td>{s.evaluations}</td>
                      <td>{num(s.avg, 1)}</td>
                      <td>
                        {num(s.min, 1)}–{num(s.max, 1)}
                      </td>
                      <td>{num(s.stddev, 2)}</td>
                      {ref && <td>{num(s.reference, 1)}</td>}
                      {ref && (
                        <td>
                          <Diff current={s.avg} reference={s.reference} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {evaluationsTable}
      </div>

      <div className="space-y-2">
        <h3>Coste a precios de su fecha</h3>
        <p className="muted">
          Precios del {date(r.summary.performed_on, "día de hoy")}
          {ref && `; la referencia, con los del ${date(ref.performed_on, "día de hoy")}`}.
          {ref && ref.performed_on !== r.summary.performed_on && " La diferencia incluye los cambios de precio entre esas fechas, no solo los de la receta."}
        </p>
        <div className="table-scroll">
          <table className="tabular-nums">
            <thead>
              <tr>
                <th>
                  <span className="sr-only">Coste</span>
                </th>
                <th>Este experimento</th>
                {ref && <th>Referencia</th>}
                {ref && <th>Diferencia</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Lote</th>
                <td>{money(r.summary.total_cost)}</td>
                {ref && <td>{money(ref.total_cost)}</td>}
                {ref && (
                  <td>
                    <Diff current={r.summary.total_cost} reference={ref.total_cost} money />
                  </td>
                )}
              </tr>
              <tr>
                <th>Por ración</th>
                <td>{money(r.summary.cost_per_serving)}</td>
                {ref && <td>{money(ref.cost_per_serving)}</td>}
                {ref && (
                  <td>
                    <Diff current={r.summary.cost_per_serving} reference={ref.cost_per_serving} money />
                  </td>
                )}
              </tr>
              <tr>
                <th>Precios</th>
                <td>{prices(r.summary.ingredients_without_price)}</td>
                {ref && <td>{prices(ref.ingredients_without_price)}</td>}
                {ref && <td />}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h3>Nutrición por ración</h3>
        {n && <p className="muted">«—»: a algún ingrediente le falta ese dato, así que no se suma.</p>}
        {n ? (
          <div className="table-scroll">
            <table className="tabular-nums">
              <thead>
                <tr>
                  <th>
                    <span className="sr-only">Nutriente</span>
                  </th>
                  <th>Este experimento</th>
                  {ref && <th>Referencia</th>}
                  {ref && <th>Diferencia</th>}
                </tr>
              </thead>
              <tbody>
                {nutrients.map(([key, name, unit]) => {
                  const cur = n[key];
                  const refValue = r.referenceNutrition?.[key] ?? null;
                  return (
                    <tr key={key}>
                      <th>{name}</th>
                      <td>
                        {num(cur, 1)} {cur != null && unit}
                      </td>
                      {ref && (
                        <td>
                          {num(refValue, 1)} {refValue != null && unit}
                        </td>
                      )}
                      {ref && (
                        <td>
                          <Diff current={cur} reference={refValue} unit={unit} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Sin datos nutricionales para esta receta.</p>
        )}
      </div>
    </Section>
  );
}

export function ObservationsSection({ r }: { r: ExperimentReport }) {
  return (
    <Section n={5} title="Observaciones">
      <Prose value={r.experiment.observations} empty="No registradas." />
    </Section>
  );
}

export function ConclusionsSection({ r, findingActions, verdictForm }: { r: ExperimentReport; findingActions: (id: string) => ReactNode; verdictForm: ReactNode }) {
  return (
    <Section n={6} title="Conclusiones">
      {r.findings.length === 0 ? (
        <p className="muted">
          Sin conclusiones todavía.
          <span className="no-print"> Se añaden en «Añadir conclusión».</span>
        </p>
      ) : (
        <ul className="space-y-3">
          {r.findings.map((f) => (
            <li key={f.id} className="space-y-1">
              <p>
                <span className="badge mr-2">{label(evidenceLevel, f.evidence_level)}</span>
                {f.statement}
              </p>
              {f.hypotheses && (
                <p className="muted">
                  Sobre la hipótesis «{f.hypotheses.statement}» ({label(hypothesisStatus, f.hypotheses.status)})
                </p>
              )}
              {findingActions(f.id)}
            </li>
          ))}
        </ul>
      )}
      {r.hypothesis && (
        <p>
          Estado actual de la hipótesis (considera todos los experimentos):{" "}
          <strong>{label(hypothesisStatus, r.hypothesis.status)}</strong>
        </p>
      )}
      {verdictForm}
    </Section>
  );
}

/** What limits the reading of the results, derived from the data (never a judgment). */
export function LimitationsSection({ r }: { r: ExperimentReport }) {
  const evaluators = new Set(r.evaluations.map((e) => e.evaluator)).size;
  const ref = r.reference;
  const withoutSheet = (n: number) => (n === 1 ? "1 ingrediente no tiene" : `${n} ingredientes no tienen`);
  const items = [
    !ref && "Sin referencia: no hay un control con el que comparar.",
    !r.hypothesis && "Sin hipótesis vinculada.",
    !!r.summary.ingredients_without_price &&
      `El coste es parcial: ${missing(r.summary.ingredients_without_price, "precio")} a la fecha del experimento.`,
    !!r.nutrition?.ingredients_without_nutrition &&
      `La nutrición es parcial: ${withoutSheet(r.nutrition.ingredients_without_nutrition)} ficha nutricional.`,
    evaluators > 0 && `Evaluado por ${evaluators} ${evaluators === 1 ? "persona" : "personas"}.`,
    r.sensory.some((s) => s.evaluations === 1) && "Algunos atributos tienen una sola evaluación: sin dispersión.",
    r.evaluations.length === 0 && "Sin evaluación sensorial.",
    // The comparison is only as good as its weaker side.
    !!ref?.ingredients_without_price &&
      `El coste de la referencia es parcial: ${missing(ref.ingredients_without_price, "precio")} a su fecha.`,
    !!r.referenceNutrition?.ingredients_without_nutrition &&
      `La nutrición de la referencia es parcial: ${withoutSheet(r.referenceNutrition.ingredients_without_nutrition)} ficha nutricional.`,
    !!ref && r.referenceSensory.length === 0 && "La referencia no tiene evaluación sensorial.",
    r.referenceSensory.some((s) => s.evaluations === 1) &&
      "Algunos atributos de la referencia tienen una sola evaluación: la diferencia no dice si es mejor o peor.",
  ].filter(Boolean) as string[];
  return (
    <Section n={7} title="Limitaciones">
      {items.length === 0 ? <p className="muted">No se detectan datos incompletos.</p> : (
        <ul className="list-inside list-disc space-y-1 text-sm">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </Section>
  );
}
