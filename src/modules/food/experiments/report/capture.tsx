import { addFinding, deleteFinding, updateHypothesisStatus } from "@/core/findings/actions";
import { evidenceLevel, hypothesisStatus } from "@/core/findings/schema";
import { num, text } from "@/shared/format";
import { ActionForm, Field, SubmitButton } from "@/shared/ui/form";
import { Options } from "@/shared/ui/options";
import { deleteEvaluation, saveEvaluation } from "../actions";
import { attributeLabel, defaultAttributes, isLiking, scaleHint } from "../sensory";
import type { ExperimentReport } from "./data";

/** Scores by evaluator (rows) and attribute (columns): the raw data behind the statistics. */
export function EvaluationsTable({ r, experimentId }: { r: ExperimentReport; experimentId: string }) {
  if (r.evaluations.length === 0) return null;
  const attributes = [...new Set(r.evaluations.map((e) => e.attribute))].sort(
    (a, b) => Number(b === "overall") - Number(a === "overall") || a.localeCompare(b, "es"),
  );
  const evaluators = [...new Set(r.evaluations.map((e) => e.evaluator))];
  const score = (evaluator: string, attribute: string) =>
    r.evaluations.find((e) => e.evaluator === evaluator && e.attribute === attribute)?.score ?? null;
  return (
    <div className="table-scroll">
      <table className="tabular-nums">
        <caption className="pb-2 text-left text-sm text-stone-600">Notas por evaluador</caption>
        <thead>
          <tr>
            <th>Evaluador</th>
            {attributes.map((a) => (
              <th key={a}>{attributeLabel(a)}</th>
            ))}
            <th>Comentario</th>
            <th className="no-print">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {evaluators.map((ev) => (
            <tr key={ev}>
              <td>{ev}</td>
              {attributes.map((a) => (
                <td key={a}>{num(score(ev, a), 1)}</td>
              ))}
              <td className="whitespace-pre-line">{text(r.evaluations.find((e) => e.evaluator === ev && e.comment)?.comment)}</td>
              <td className="no-print text-right">
                <ActionForm
                  action={deleteEvaluation.bind(null, experimentId, ev)}
                  confirm={`¿Borrar todas las notas de ${ev} en este experimento?`}
                >
                  <SubmitButton className="btn btn-danger">
                    Borrar<span className="sr-only"> las notas de {ev}</span>
                  </SubmitButton>
                </ActionForm>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * One evaluator's scores; blank means not scored. Re-sending an evaluator corrects their scores.
 * The signed-in person is proposed as evaluator until they have scored this run, so entering
 * someone else's scores next never overwrites their own by accident.
 */
export function EvaluationForm({ r, experimentId, me }: { r: ExperimentReport; experimentId: string; me: string }) {
  const attributes = [...new Set([...defaultAttributes, ...r.knownAttributes])];
  const evaluators = [...new Set(r.evaluations.map((e) => e.evaluator))];
  const scoreField = (a: string) => (
    <Field key={a} label={attributeLabel(a)} name={`score__${a}`} hint={scaleHint(a)}>
      <input name={`score__${a}`} type="number" min="0" max="10" step="0.5" inputMode="decimal" />
    </Field>
  );
  return (
    <ActionForm action={saveEvaluation.bind(null, experimentId)} className="form-grid" resetOnSuccess>
      <Field
        label="Evaluador"
        name="evaluator"
        hint="Quien prueba y puntúa (no quien preparó la receta). Usa un código, como P1, si la cata es anónima. Si ya evaluó, sustituye su evaluación anterior."
      >
        <input name="evaluator" list="evaluator-names" autoComplete="off" required defaultValue={evaluators.includes(me) ? "" : me} />
      </Field>
      <datalist id="evaluator-names">
        {evaluators.map((e) => (
          <option key={e} value={e} />
        ))}
      </datalist>
      <p className="muted sm:col-span-full">Notas de 0 a 10, de medio en medio punto. Vacío = no evaluado (no es un 0).</p>
      <fieldset className="grid gap-3 sm:col-span-full sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-1 text-sm font-medium">Agrado: cuánto gusta</legend>
        {attributes.filter(isLiking).map(scoreField)}
      </fieldset>
      <fieldset className="grid gap-3 sm:col-span-full sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-1 text-sm font-medium">Intensidad: cuánto se nota</legend>
        <p className="muted sm:col-span-full">Más alto = más, no mejor. No importa si te gusta.</p>
        {attributes.filter((a) => !isLiking(a)).map(scoreField)}
      </fieldset>
      {[1, 2].map((n) => (
        <div key={n} className="grid grid-cols-2 gap-2">
          <Field
            label={`Otro atributo ${n}`}
            name={`extra_attribute_${n}`}
            hint={n === 1 ? "Se puntúa como intensidad (0 = nada, 10 = mucho). Ej.: acidez, salinidad." : undefined}
          >
            <input name={`extra_attribute_${n}`} autoComplete="off" />
          </Field>
          <Field label="Nota" name={`extra_score_${n}`}>
            <input name={`extra_score_${n}`} type="number" min="0" max="10" step="0.5" inputMode="decimal" />
          </Field>
        </div>
      ))}
      <Field label="Comentario" name="comment" wide>
        <textarea name="comment" rows={2} />
      </Field>
      <div>
        <SubmitButton>Guardar evaluación</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function ConclusionForm({ r, projectId, experimentId }: { r: ExperimentReport; projectId: string; experimentId: string }) {
  return (
    <ActionForm action={addFinding.bind(null, projectId, experimentId)} className="form-grid" resetOnSuccess>
      <Field label="Conclusión" name="statement" wide hint="Lo que muestran los resultados, en una o dos frases.">
        <textarea name="statement" rows={2} required />
      </Field>
      <Field label="Nivel de evidencia" name="evidence_level" hint="Confirmado solo si está comprobado y es repetible.">
        <select name="evidence_level" defaultValue="preliminary">
          <Options labels={evidenceLevel} />
        </select>
      </Field>
      <Field label="Hipótesis" name="hypothesis_id">
        <select name="hypothesis_id" defaultValue={r.experiment.hypothesis_id ?? ""}>
          <option value="">Ninguna</option>
          {r.hypotheses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.statement.length > 80 ? `${h.statement.slice(0, 80)}…` : h.statement}
            </option>
          ))}
        </select>
      </Field>
      <div>
        <SubmitButton>Añadir conclusión</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function FindingDelete({ id }: { id: string }) {
  return (
    <ActionForm action={deleteFinding.bind(null, id)} confirm="¿Borrar esta conclusión?" className="no-print">
      <SubmitButton className="btn btn-danger">
        Borrar<span className="sr-only"> esta conclusión</span>
      </SubmitButton>
    </ActionForm>
  );
}

/** The verdict on the experiment's hypothesis, set where the evidence is. */
export function VerdictForm({ r }: { r: ExperimentReport }) {
  if (!r.hypothesis) return null;
  return (
    <ActionForm action={updateHypothesisStatus.bind(null, r.hypothesis.id)} className="no-print flex flex-wrap items-end gap-2">
      <Field label="Cambiar el veredicto de la hipótesis" name="status">
        <select name="status" defaultValue={r.hypothesis.status}>
          <Options labels={hypothesisStatus} />
        </select>
      </Field>
      <SubmitButton className="btn btn-secondary">Guardar veredicto</SubmitButton>
    </ActionForm>
  );
}
