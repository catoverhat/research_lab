import type { Tables } from "@/shared/database/database.types";
import { Field } from "@/shared/ui/form";
import { Options } from "@/shared/ui/options";
import { experimentStatus, isRecorded, recordedStatus } from "./schema";

type Formulation = { id: string; code: string; version: number; name: string | null };
type Hypothesis = { id: string; statement: string };

/** The recipe is chosen once: moving a run to another recipe would rewrite its history. */
export function ExperimentFields({
  experiment,
  formulations,
  hypotheses,
}: {
  experiment?: Tables<"experiments">;
  formulations?: Formulation[];
  hypotheses: Hypothesis[];
}) {
  return (
    <>
      {formulations && (
        <Field label="Receta" name="formulation_id">
          <select name="formulation_id" required defaultValue="">
            <option value="" disabled>
              Elige una receta
            </option>
            {formulations.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} v{f.version}
                {f.name && ` · ${f.name}`}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Hipótesis que pone a prueba" name="hypothesis_id">
        <select name="hypothesis_id" defaultValue={experiment?.hypothesis_id ?? ""}>
          <option value="">Ninguna</option>
          {hypotheses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.statement.length > 90 ? `${h.statement.slice(0, 90)}…` : h.statement}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Estado" name="status">
        <select name="status" defaultValue={experiment?.status ?? "planned"}>
          <Options labels={experiment && isRecorded(experiment.status) ? recordedStatus : experimentStatus} />
        </select>
      </Field>
      <Field label="Fecha de realización" name="performed_on">
        <input name="performed_on" type="date" defaultValue={experiment?.performed_on ?? ""} />
      </Field>
      <Field label="Condiciones" name="conditions" wide>
        <textarea name="conditions" rows={3} defaultValue={experiment?.conditions ?? ""} />
      </Field>
      <Field label="Observaciones" name="observations" wide>
        <textarea name="observations" rows={4} defaultValue={experiment?.observations ?? ""} />
      </Field>
    </>
  );
}
