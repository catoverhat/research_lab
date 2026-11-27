import { units } from "@/core/products/schema";
import type { Tables } from "@/shared/database/database.types";
import { Field } from "@/shared/ui/form";
import { Options } from "@/shared/ui/options";
import { formulationStatus } from "./schema";

/** Code and version identify a recipe, so the code is only asked for when creating it. */
export function FormulationFields({ formulation }: { formulation?: Tables<"formulations"> }) {
  return (
    <>
      {!formulation && (
        <Field label="Código" name="code" hint="Por ejemplo F07. Las versiones comparten código.">
          <input name="code" required />
        </Field>
      )}
      <Field label="Nombre" name="name">
        <input name="name" defaultValue={formulation?.name ?? ""} />
      </Field>
      <Field label="Estado" name="status">
        <select name="status" defaultValue={formulation?.status ?? "draft"}>
          <Options labels={formulationStatus} />
        </select>
      </Field>
      <Field label="Raciones por lote" name="servings">
        <input name="servings" type="number" step="any" min="0" defaultValue={formulation?.servings ?? ""} />
      </Field>
      <Field label="Tamaño de la ración" name="serving_size">
        <input name="serving_size" type="number" step="any" min="0" defaultValue={formulation?.serving_size ?? ""} />
      </Field>
      <Field label="Unidad de la ración" name="serving_unit">
        <select name="serving_unit" defaultValue={formulation?.serving_unit ?? ""}>
          <option value="">—</option>
          <Options labels={units} />
        </select>
      </Field>
      <Field label="Preparación" name="instructions" wide>
        <textarea name="instructions" rows={4} defaultValue={formulation?.instructions ?? ""} />
      </Field>
      <Field label="Notas" name="notes" wide>
        <textarea name="notes" rows={3} defaultValue={formulation?.notes ?? ""} />
      </Field>
    </>
  );
}
