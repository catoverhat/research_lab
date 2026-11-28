import Link from "next/link";
import { label } from "@/shared/format";
import { must, type Client } from "@/shared/supabase/server";
import { evidenceLevel, hypothesisStatus } from "./schema";

/** The project's state of knowledge: each hypothesis with its verdict, the conclusions by strength of evidence. */
export async function EvidenceSection({ supabase, projectId }: { supabase: Client; projectId: string }) {
  const [hypotheses, findings] = await Promise.all([
    supabase.from("hypotheses").select("id, statement, status").eq("project_id", projectId).order("created_at").order("id"),
    supabase
      .from("findings")
      .select("id, statement, evidence_level, experiment_id, hypotheses(statement), experiments(formulations(code, version))")
      .eq("project_id", projectId)
      .order("created_at")
      .order("id"),
  ]);
  const hs = must(hypotheses);
  const fs = must(findings);
  const byStatus = Object.keys(hypothesisStatus)
    .map((s) => [s, hs.filter((h) => h.status === s).length] as const)
    .filter(([, n]) => n > 0);
  // Strongest evidence first (the order of the labels).
  const byLevel = Object.keys(evidenceLevel)
    .map((level) => [level, fs.filter((f) => f.evidence_level === level)] as const)
    .filter(([, list]) => list.length > 0);

  return (
    <section className="card" aria-labelledby="evidence">
      <h2 id="evidence">Hipótesis y conclusiones</h2>
      {hs.length === 0 && fs.length === 0 && <p className="muted">Aún no hay hipótesis ni conclusiones.</p>}
      {hs.length > 0 && (
        <div className="space-y-2">
          <h3>Hipótesis</h3>
          <p className="text-sm text-stone-600">{byStatus.map(([s, n]) => `${label(hypothesisStatus, s)}: ${n}`).join(" · ")}</p>
          <ul className="space-y-1 text-sm">
            {hs.map((h) => (
              <li key={h.id}>
                <span className="badge mr-2">{label(hypothesisStatus, h.status)}</span>
                {h.statement}
              </li>
            ))}
          </ul>
        </div>
      )}
      {byLevel.map(([level, list]) => (
        <div key={level} className="space-y-2">
          <h3>
            Conclusiones: {label(evidenceLevel, level).toLowerCase()}{" "}
            <span className="text-sm font-normal text-stone-600">({list.length})</span>
          </h3>
          <ul className="space-y-2 text-sm">
            {list.map((f) => {
              const run = f.experiments?.formulations;
              return (
                <li key={f.id}>
                  {f.statement}
                  {f.experiment_id && (
                    <>
                      {" "}
                      <Link href={`/projects/${projectId}/experiments/${f.experiment_id}`}>
                        (ver experimento{run && ` ${run.code} v${run.version}`})
                      </Link>
                    </>
                  )}
                  {f.hypotheses && <p className="muted">Sobre la hipótesis «{f.hypotheses.statement}»</p>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
