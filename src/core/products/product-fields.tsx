import type { Tables } from "@/shared/database/database.types";
import { Field } from "@/shared/ui/form";
import { Options } from "@/shared/ui/options";
import { units } from "./schema";

export function ProductFields({
  product,
  ingredient,
  ingredientNames,
}: {
  product?: Tables<"products">;
  ingredient?: string | null;
  ingredientNames: string[];
}) {
  return (
    <>
      <Field label="Marca" name="brand">
        <input name="brand" defaultValue={product?.brand ?? ""} />
      </Field>
      <Field label="Nombre" name="name">
        <input name="name" required defaultValue={product?.name} />
      </Field>
      <Field label="Tamaño del envase" name="package_size" hint="En la unidad de abajo. Las recetas usan esta unidad.">
        <input name="package_size" type="number" step="any" min="0" required defaultValue={product?.package_size} />
      </Field>
      <Field label="Unidad" name="unit">
        <select name="unit" defaultValue={product?.unit ?? "g"}>
          <Options labels={units} />
        </select>
      </Field>
      <Field label="Ingrediente genérico" name="ingredient" hint="Escribe uno nuevo o elige uno existente.">
        <input name="ingredient" list="ingredient-names" defaultValue={ingredient ?? ""} />
        <datalist id="ingredient-names">
          {ingredientNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Field>
      <Field label="Código de barras" name="barcode">
        <input name="barcode" defaultValue={product?.barcode ?? ""} />
      </Field>
      <Field label="Notas" name="notes" wide>
        <textarea name="notes" rows={3} defaultValue={product?.notes ?? ""} />
      </Field>
    </>
  );
}
