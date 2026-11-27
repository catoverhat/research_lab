import Link from "next/link";
import { notFound } from "next/navigation";
import { label, num } from "@/shared/format";
import { must, requireUser } from "@/shared/supabase/server";
import { ActionForm, SubmitButton } from "@/shared/ui/form";
import { deleteExperiment, updateExperiment } from "@/modules/food/experiments/actions";
import { ExperimentFields } from "@/modules/food/experiments/experiment-fields";
import { experimentStatus } from "@/modules/food/experiments/schema";
import { CostCell } from "@/modules/food/formulations/formulations-section";

export const metadata = { title: "Experimento" };

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ projectId: string; experimentId: string }>;
}) {
  const { projectId, experimentId } = await params;
  const supabase = await requireUser();
  const [experiment, summary, hypotheses] = await Promise.all([
    supabase.from("experiments").select("*").eq("id", experimentId).maybeSingle(),
    supabase
      .from("v_experiment_summary")
      .select("formulation_id, code, version, total_cost, ingredients_without_price, evaluations, overall_score")
      .eq("experiment_id", experimentId)
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase.from("hypotheses").select("id, statement").eq("project_id", projectId).order("created_at").order("id"),
  ]);
  const e = must(experiment);
  const s = must(summary);
  if (!e || !s) notFound();

  return (
    <>
      <p className="muted">
        <Link href={`/projects/${projectId}`}>Proyecto</Link> · Receta{" "}
        <Link href={`/projects/${projectId}/formulations/${s.formulation_id}`}>
          {s.code} v{s.version}
        </Link>
      </p>
      <h1>
        Experimento {e.performed_on ?? "sin fecha"}{" "}
        <span className="badge align-middle">{label(experimentStatus, e.status)}</span>
      </h1>

      <section className="card">
        <p>
          {e.performed_on
            ? `Coste del lote con los precios del ${e.performed_on}: `
            : "Coste estimado del lote a precios actuales (aún sin fecha de realización): "}
          <CostCell value={s.total_cost} missing={s.ingredients_without_price} />
        </p>
        <p>
          Evaluaciones sensoriales: {s.evaluations ?? 0} · nota global: {num(s.overall_score, 1)}
        </p>
      </section>

      <section className="card">
        <h2>Datos del experimento</h2>
        <p className="muted">
          Al marcarlo realizado o fallido, la composición de la receta queda congelada. Lo no medido se deja vacío.
        </p>
        <ActionForm action={updateExperiment.bind(null, e.id)} className="form-grid">
          <ExperimentFields experiment={e} hypotheses={must(hypotheses)} />
          <div>
            <SubmitButton>Guardar</SubmitButton>
          </div>
        </ActionForm>
        <ActionForm
          action={deleteExperiment.bind(null, e.id, projectId)}
          className="danger-zone"
          confirm="¿Borrar este experimento y sus evaluaciones sensoriales?"
        >
          <SubmitButton className="btn btn-danger">Borrar experimento</SubmitButton>
        </ActionForm>
      </section>
    </>
  );
}
