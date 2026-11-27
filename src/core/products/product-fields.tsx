import type { Tables } from "@/shared/database/database.types";
import { num, unitLabel } from "@/shared/format";
import { Field } from "@/shared/ui/form";
import { Options } from "@/shared/ui/options";
import { units } from "./schema";

export function ProductFields({
  product,
  ingredient,
  ingredientNames,
  locked,
}: {
  product?: Tables<"products">;
  ingredient?: string | null;
  ingredientNames: string[];
  /** Has prices or is in recipes: size and unit are fixed (the server checks it too). */
  locked?: boolean;
}) {
  return (
    <>
      <Field label="Marca" name="brand">
        <input name="brand" defaultValue={product?.brand ?? ""} />
      </Field>
      <Field label="Nombre" name="name">
        <input name="name" required defaultValue={product?.name} />
      </Field>
      {locked && product ? (
        <p className="muted sm:col-span-full">
          <input type="hidden" name="package_size" value={product.package_size} />
          <input type="hidden" name="unit" value={product.unit} />
          Envase de {num(product.package_size, 1)} {unitLabel(product.unit)}. No se cambia porque ya tiene precios o
          está en recetas; para otra presentación, crea otro producto.
        </p>
      ) : (
        <>
          <Field label="Tamaño del envase" name="package_size" hint="En la unidad de abajo. Las recetas usan esta unidad.">
            <input name="package_size" type="number" step="any" min="0" required defaultValue={product?.package_size} />
          </Field>
          <Field label="Unidad" name="unit">
            <select name="unit" defaultValue={product?.unit ?? "g"}>
              <Options labels={units} />
            </select>
          </Field>
        </>
      )}
      <Field label="Ingrediente genérico" name="ingredient" hint="Escribe uno nuevo o elige uno existente.">
        <input name="ingredient" list="ingredient-names" autoComplete="off" defaultValue={ingredient ?? ""} />
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
