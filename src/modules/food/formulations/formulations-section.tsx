import Link from "next/link";
import { label, missing as missingText, money, text } from "@/shared/format";
import { must, type Client } from "@/shared/supabase/server";
import { ActionForm, SubmitButton } from "@/shared/ui/form";
import { createFormulation } from "./actions";
import { FormulationFields } from "./formulation-fields";
import { formulationStatus } from "./schema";

/** A cost; a partial sum is labelled, never shown as complete. */
export function CostCell({ value, missing, batch }: { value: number | null; missing: number | null; batch?: boolean }) {
  return (
    <>
      {money(value)}
      {batch && value != null && " por lote"}
      {!!missing && <span className="warning"> · {missingText(missing, "precio")}</span>}
    </>
  );
}

export async function FormulationsSection({ supabase, projectId }: { supabase: Client; projectId: string }) {
  const [formulations, costs] = await Promise.all([
    supabase
      .from("formulations")
      .select("id, code, version, name, status")
      .eq("project_id", projectId)
      .order("code")
      .order("version"),
    supabase
      .from("v_formulation_cost")
      .select("formulation_id, cost_per_serving, total_cost, ingredients_without_price")
      .eq("project_id", projectId),
  ]);
  const recipes = must(formulations);
  const costById = new Map(must(costs).map((c) => [c.formulation_id, c]));

  return (
    <section className="card">
      <h2>Recetas</h2>
      {recipes.length === 0 ? (
        <p className="muted">Aún no hay recetas.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Receta</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Coste por ración (precios actuales)</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((f) => {
                const cost = costById.get(f.id);
                return (
                  <tr key={f.id}>
                    <td>
                      <Link href={`/projects/${projectId}/formulations/${f.id}`}>
                        {f.code} v{f.version}
                      </Link>
                    </td>
                    <td>{text(f.name)}</td>
                    <td>{label(formulationStatus, f.status)}</td>
                    <td>
                      <CostCell
                        value={cost?.cost_per_serving ?? cost?.total_cost ?? null}
                        batch={cost?.cost_per_serving == null}
                        missing={cost?.ingredients_without_price ?? null}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <details>
        <summary>Nueva receta</summary>
        <ActionForm action={createFormulation.bind(null, projectId)} className="form-grid pt-3">
          <FormulationFields />
          <div>
            <SubmitButton>Crear receta</SubmitButton>
          </div>
        </ActionForm>
      </details>
    </section>
  );
}
