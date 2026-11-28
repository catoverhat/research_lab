import Link from "next/link";
import { notFound } from "next/navigation";
import { date, label, missing, money, num, signed } from "@/shared/format";
import { displayName, sessionClaims } from "@/core/auth/user";
import { requireUser } from "@/shared/supabase/server";
import { ActionForm, SubmitButton } from "@/shared/ui/form";
import { PrintButton } from "@/shared/ui/print-button";
import { StatTile, trendOf } from "@/shared/ui/stat-tile";
import { deleteExperiment, updateExperiment } from "@/modules/food/experiments/actions";
import { ExperimentFields } from "@/modules/food/experiments/experiment-fields";
import { ConclusionForm, EvaluationForm, EvaluationsTable, FindingDelete, VerdictForm } from "@/modules/food/experiments/report/capture";
import { comparable, delta } from "@/modules/food/experiments/report/compare";
import { loadExperimentReport } from "@/modules/food/experiments/report/data";
import {
  ConclusionsSection,
  DesignSection,
  HypothesisSection,
  LimitationsSection,
  MethodSection,
  ObservationsSection,
  ResultsSection,
  runLabel,
} from "@/modules/food/experiments/report/sections";
import { experimentStatus, isRecorded } from "@/modules/food/experiments/schema";

type Props = { params: Promise<{ projectId: string; experimentId: string }> };

// The tab and the printed/saved PDF are named after the run, so several reports can be told apart.
export async function generateMetadata({ params }: Props) {
  const { experimentId } = await params;
  const supabase = await requireUser();
  const { data } = await supabase
    .from("experiments")
    .select("performed_on, formulations(code, version)")
    .eq("id", experimentId)
    .maybeSingle();
  const f = data?.formulations;
  return { title: f ? `${f.code} v${f.version} · ${date(data.performed_on, "sin fecha")} · Informe de experimento` : "Experimento" };
}

export default async function ExperimentPage({ params }: Props) {
  const { projectId, experimentId } = await params;
  const supabase = await requireUser();
  const [r, claims] = await Promise.all([loadExperimentReport(supabase, projectId, experimentId), sessionClaims(supabase)]);
  const me = displayName(claims);
  if (!r) notFound();

  const { experiment: e, summary: s, reference: ref, formulation: f } = r;
  const overall = r.sensory.find((x) => x.attribute === "overall");
  const refOverall = r.referenceSensory.find((x) => x.attribute === "overall");
  const scoreDiff = delta(overall?.avg, refOverall?.avg);
  const costDiff = delta(s.cost_per_serving, ref?.cost_per_serving);
  const scoreJudged = comparable({ evaluations: overall?.evaluations }, { evaluations: refOverall?.evaluations });
  const costJudged = comparable({ partial: !!s.ingredients_without_price }, { partial: !!ref?.ingredients_without_price });
  const evaluators = new Set(r.evaluations.map((x) => x.evaluator)).size;
  const recorded = isRecorded(e.status);
  const compareHref = `/projects/${projectId}/compare?e=${experimentId}${ref ? `&e=${ref.experiment_id}` : ""}`;

  return (
    <article className="report space-y-6">
      <p className="muted no-print">
        <Link href={`/projects/${projectId}`}>{r.projectTitle}</Link> · Receta{" "}
        <Link href={`/projects/${projectId}/formulations/${f.id}`}>
          {f.code} v{f.version}
        </Link>
      </p>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium tracking-wide text-stone-600 uppercase">Informe de experimento</p>
          <h1>
            {f.code} v{f.version} · {date(e.performed_on, "sin fecha")}{" "}
            <span className="badge align-middle">{label(experimentStatus, e.status)}</span>
          </h1>
          {f.name && <p className="text-stone-700">{f.name}</p>}
          <p className="muted">Proyecto: {r.projectTitle}</p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Link href={compareHref} className="btn btn-secondary no-underline">
            Comparar
          </Link>
          <PrintButton />
        </div>
      </header>

      {!recorded && (
        <p role="status" className="card">
          <strong>{label(experimentStatus, e.status)}:</strong> aún no hay resultados.
          {e.status === "planned" && " Al marcarlo realizado o fallido se pueden registrar las evaluaciones."}
        </p>
      )}

      <section aria-label="Cifras clave" className="grid gap-3 sm:grid-cols-4">
        <StatTile
          label="Nota global"
          value={overall ? `${num(overall.avg, 1)} / 10` : "—"}
          detail={overall ? `${overall.evaluations} ${overall.evaluations === 1 ? "evaluación" : "evaluaciones"} · desv. ${num(overall.stddev, 2)}` : "Sin evaluar"}
          trend={trendOf(scoreDiff?.abs ?? null, signed(scoreDiff?.abs, 1), true, scoreJudged)}
        />
        <StatTile
          label="Coste por ración"
          value={money(s.cost_per_serving)}
          detail={`Precios del ${date(s.performed_on, "día de hoy")}${s.ingredients_without_price ? ` · ${missing(s.ingredients_without_price, "precio")}` : ""}`}
          trend={trendOf(costDiff?.abs ?? null, money(Math.abs(costDiff?.abs ?? 0)), false, costJudged)}
        />
        <StatTile label="Evaluadores" value={evaluators || "—"} detail={`${r.evaluations.length} notas registradas`} />
        <StatTile
          label="Referencia"
          value={ref ? `${ref.code} v${ref.version}` : "—"}
          detail={ref ? date(ref.performed_on, "sin fecha") : "Sin referencia"}
        />
      </section>

      <HypothesisSection r={r} />
      <DesignSection r={r} projectId={projectId} />
      <MethodSection r={r} projectId={projectId} />
      <ResultsSection r={r} evaluationsTable={<EvaluationsTable r={r} experimentId={experimentId} />} />
      <ObservationsSection r={r} />
      <ConclusionsSection r={r} findingActions={(id) => <FindingDelete id={id} />} verdictForm={<VerdictForm r={r} />} />
      <LimitationsSection r={r} />

      <div className="no-print space-y-4">
        <h2>Registrar datos</h2>
        {recorded ? (
          <details id="capture-evaluation" className="card">
            <summary>Registrar evaluación sensorial</summary>
            <EvaluationForm r={r} experimentId={experimentId} me={me} />
          </details>
        ) : (
          <p className="muted">La evaluación sensorial se registra cuando el experimento está realizado o fallido.</p>
        )}
        <details id="capture-conclusion" className="card">
          <summary>Añadir conclusión</summary>
          <ConclusionForm r={r} projectId={projectId} experimentId={experimentId} />
        </details>
        <details id="capture-edit" className="card">
          <summary>Editar datos del experimento</summary>
          <p className="muted">Al marcarlo realizado o fallido, la composición de la receta queda congelada.</p>
          <ActionForm action={updateExperiment.bind(null, e.id)} className="form-grid">
            <ExperimentFields
              experiment={e}
              hypotheses={r.hypotheses}
              references={r.otherRuns.map((run) => ({ id: run.experiment_id!, label: runLabel(run) }))}
              suggestion={r.suggestedReference ? runLabel(r.suggestedReference) : undefined}
            />
            <div>
              <SubmitButton>Guardar</SubmitButton>
            </div>
          </ActionForm>
          <ActionForm
            action={deleteExperiment.bind(null, e.id, projectId)}
            className="danger-zone"
            confirm="¿Borrar este experimento? Se borran sus evaluaciones sensoriales; sus conclusiones se conservan, sin experimento."
          >
            <SubmitButton className="btn btn-danger">Borrar experimento</SubmitButton>
          </ActionForm>
        </details>
      </div>
    </article>
  );
}
