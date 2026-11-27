import { z } from "zod";
import { oneOf, optionalDate, optionalId, optionalText, requiredId } from "@/shared/forms";

export const experimentStatus = {
  planned: "Planificado",
  completed: "Realizado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

/** Completed and failed runs are recorded history: they freeze their recipe. */
export const recordedStatus = { completed: experimentStatus.completed, failed: experimentStatus.failed };
export const isRecorded = (status: string) => Object.hasOwn(recordedStatus, status);

const base = z.object({
  hypothesis_id: optionalId,
  status: oneOf(experimentStatus),
  performed_on: optionalDate,
  conditions: optionalText,
  observations: optionalText,
});

// Same rule as the table's check: what was run has a date.
const performedHasDate = (d: { status: string; performed_on: string | null }) =>
  d.status === "planned" || d.status === "cancelled" || d.performed_on !== null;
const performedHasDateError = { message: "Un experimento realizado o fallido necesita fecha.", path: ["performed_on"] };

export const experimentSchema = base.refine(performedHasDate, performedHasDateError);
export const newExperimentSchema = base
  .extend({ formulation_id: requiredId })
  .refine(performedHasDate, performedHasDateError);
