import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { date, label } from "@/shared/format";
import { must, requireUser } from "@/shared/supabase/server";
import { PrintButton } from "@/shared/ui/print-button";
import { Comparison } from "@/modules/food/experiments/comparison";
import { experimentStatus } from "@/modules/food/experiments/schema";

export const metadata = { title: "Comparar experimentos" };

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ e?: string | string[] }>;
}) {
  const [{ projectId }, { e }] = await Promise.all([params, searchParams]);
  // The URL is outside input: keep only valid ids, and a sane number of them.
  const selected = [...new Set([e ?? []].flat())].filter((id) => z.guid().safeParse(id).success).slice(0, 12);
  const supabase = await requireUser();
  const [project, runsRes] = await Promise.all([
    supabase.from("research_projects").select("id, title").eq("id", projectId).maybeSingle(),
    supabase
      .from("v_experiment_summary")
      .select("*")
      .eq("project_id", projectId)
      .order("performed_on", { ascending: false, nullsFirst: true })
      .order("experiment_id"),
  ]);
  const p = must(project);
  if (!p) notFound();
  const runs = must(runsRes);
  // In the order chosen; an id from another project is simply not found here.
  const chosen = selected.flatMap((id) => runs.filter((r) => r.experiment_id === id));

  return (
    <article className="report space-y-6">
      <p className="muted no-print">
        <Link href={`/projects/${projectId}`}>{p.title}</Link>
      </p>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1>Comparar experimentos</h1>
        <PrintButton />
      </header>

      {runs.length < 2 ? (
        <p className="muted">
          {runs.length === 0 ? "Este proyecto no tiene experimentos todavía" : "Este proyecto tiene un solo experimento"}: hacen falta
          dos para comparar.
        </p>
      ) : (
        // A GET form: the selection lives in the URL, so a comparison can be bookmarked or shared.
        <form className="card no-print space-y-3">
          <fieldset className="grid gap-1 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Experimentos (elige dos o más; en la gráfica, hasta cuatro)</legend>
            {runs.map((r) => (
              <label key={r.experiment_id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="e"
                  value={r.experiment_id}
                  defaultChecked={selected.includes(r.experiment_id)}
                  className="w-auto"
                />
                {r.code} v{r.version} · {date(r.performed_on, "sin fecha")} · {label(experimentStatus, r.status)}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn">
            Comparar
          </button>
        </form>
      )}

      {chosen.length >= 2 ? (
        <Comparison supabase={supabase} projectId={projectId} runs={chosen} />
      ) : (
        runs.length >= 2 && <p className="muted">Elige al menos dos experimentos.</p>
      )}
    </article>
  );
}
