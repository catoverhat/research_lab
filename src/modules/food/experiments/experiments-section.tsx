import Link from "next/link";
import { label, num, text } from "@/shared/format";
import { must, type Client } from "@/shared/supabase/server";
import { ActionForm, SubmitButton } from "@/shared/ui/form";
import { CostCell } from "../formulations/formulations-section";
import { createExperiment } from "./actions";
import { ExperimentFields } from "./experiment-fields";
import { experimentStatus } from "./schema";

export async function ExperimentsSection({ supabase, projectId }: { supabase: Client; projectId: string }) {
  const [experiments, formulations, hypotheses] = await Promise.all([
    supabase
      .from("v_experiment_summary")
      .select("experiment_id, code, version, status, performed_on, total_cost, ingredients_without_price, overall_score")
      .eq("project_id", projectId)
      .order("performed_on", { ascending: false, nullsFirst: true }),
    supabase
      .from("formulations")
      .select("id, code, version, name")
      .eq("project_id", projectId)
      .order("code")
      .order("version"),
    supabase.from("hypotheses").select("id, statement").eq("project_id", projectId).order("created_at").order("id"),
  ]);

  return (
    <section className="card">
      <h2>Experimentos</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Receta</th>
            <th>Estado</th>
            <th>Coste del lote (precios de su fecha)</th>
            <th>Nota global</th>
          </tr>
        </thead>
        <tbody>
          {must(experiments).map((e) => (
            <tr key={e.experiment_id}>
              <td>
                <Link href={`/projects/${projectId}/experiments/${e.experiment_id}`}>{text(e.performed_on)}</Link>
              </td>
              <td>
                {e.code} v{e.version}
              </td>
              <td>{label(experimentStatus, e.status)}</td>
              <td>
                <CostCell value={e.total_cost} missing={e.ingredients_without_price} />
              </td>
              <td>{num(e.overall_score, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <details>
        <summary>Nuevo experimento</summary>
        <ActionForm action={createExperiment.bind(null, projectId)} className="form-grid pt-3">
          <ExperimentFields formulations={must(formulations)} hypotheses={must(hypotheses)} />
          <div>
            <SubmitButton>Crear experimento</SubmitButton>
          </div>
        </ActionForm>
      </details>
    </section>
  );
}
