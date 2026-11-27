import Link from "next/link";
import { notFound } from "next/navigation";
import { units } from "@/core/products/schema";
import { label, num, productLabel, text } from "@/shared/format";
import { must, requireUser } from "@/shared/supabase/server";
import { ActionForm, Field, SubmitButton } from "@/shared/ui/form";
import { experimentStatus } from "@/modules/food/experiments/schema";
import {
  addIngredient,
  createVersion,
  deleteFormulation,
  removeIngredient,
  updateFormulation,
  updateIngredient,
} from "@/modules/food/formulations/actions";
import { FormulationFields } from "@/modules/food/formulations/formulation-fields";
import { CostCell } from "@/modules/food/formulations/formulations-section";
import { formulationStatus } from "@/modules/food/formulations/schema";

const nutrients = [
  ["energy_kcal", "Energía", "kcal"],
  ["fat_g", "Grasas", "g"],
  ["saturated_fat_g", "Saturadas", "g"],
  ["carbohydrates_g", "Carbohidratos", "g"],
  ["sugars_g", "Azúcares", "g"],
  ["fiber_g", "Fibra", "g"],
  ["protein_g", "Proteína", "g"],
  ["sodium_mg", "Sodio", "mg"],
] as const;

export default async function FormulationPage({
  params,
}: {
  params: Promise<{ projectId: string; formulationId: string }>;
}) {
  const { projectId, formulationId } = await params;
  const supabase = await requireUser();
  const f = must(
    await supabase.from("formulations").select("*").eq("id", formulationId).eq("project_id", projectId).maybeSingle(),
  );
  if (!f) notFound();

  const [ingredients, cost, nutrition, experiments, versions, products] = await Promise.all([
    supabase
      .from("formulation_ingredients")
      .select("id, quantity, notes, products(brand, name, package_size, unit)")
      .eq("formulation_id", f.id)
      // Rows imported in one transaction share created_at; id keeps the order stable between reloads.
      .order("created_at")
      .order("id"),
    supabase.from("v_formulation_cost").select("*").eq("formulation_id", f.id).maybeSingle(),
    supabase.from("v_formulation_nutrition").select("*").eq("formulation_id", f.id).maybeSingle(),
    supabase.from("experiments").select("id, status, performed_on").eq("formulation_id", f.id).order("performed_on"),
    supabase.from("formulations").select("id, version").eq("project_id", projectId).eq("code", f.code).order("version"),
    supabase.from("products").select("id, brand, name, package_size, unit").order("brand").order("name"),
  ]);
  const runs = must(experiments);
  // Same rule as the database trigger: completed or failed runs freeze the composition.
  const frozen = runs.some((e) => e.status === "completed" || e.status === "failed");
  const c = must(cost);
  const n = must(nutrition);

  return (
    <>
      <p className="muted">
        <Link href={`/projects/${projectId}`}>Proyecto</Link> · Versiones:{" "}
        {must(versions).map((v, i) => (
          <span key={v.id}>
            {i > 0 && " · "}
            {v.id === f.id ? <strong>v{v.version}</strong> : <Link href={`/projects/${projectId}/formulations/${v.id}`}>v{v.version}</Link>}
          </span>
        ))}
      </p>
      <h1>
        {f.code} v{f.version} {f.name && `· ${f.name}`}{" "}
        <span className="badge align-middle">{label(formulationStatus, f.status)}</span>
      </h1>

      <section className="card">
        <h2>Ingredientes</h2>
        {frozen && (
          <div className="warning flex flex-wrap items-center gap-3">
            <span>Tiene experimentos realizados: cantidades y productos congelados. Las notas siguen editables.</span>
            <ActionForm action={createVersion.bind(null, f.id)}>
              <SubmitButton className="btn btn-secondary">Crear versión nueva</SubmitButton>
            </ActionForm>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th className="w-32">Cantidad</th>
              <th>Notas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {must(ingredients).map((i) => (
              <tr key={i.id}>
                <td>{i.products && productLabel(i.products)}</td>
                <td colSpan={3}>
                  <ActionForm action={updateIngredient.bind(null, i.id)} className="flex items-start gap-2">
                    <div className="flex w-32 shrink-0 items-center gap-1">
                      <input
                        name="quantity"
                        type="number"
                        step="any"
                        min="0"
                        required
                        aria-label="Cantidad"
                        defaultValue={i.quantity}
                        readOnly={frozen}
                      />
                      <span className="muted">{i.products?.unit}</span>
                    </div>
                    <textarea name="notes" rows={1} aria-label="Notas" defaultValue={i.notes ?? ""} />
                    <SubmitButton className="btn btn-secondary">Guardar</SubmitButton>
                  </ActionForm>
                  {!frozen && (
                    <ActionForm action={removeIngredient.bind(null, i.id)} confirm="¿Quitar este ingrediente?">
                      <SubmitButton className="btn btn-danger mt-1">Quitar</SubmitButton>
                    </ActionForm>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!frozen && (
          <ActionForm action={addIngredient.bind(null, f.id)} className="form-grid" resetOnSuccess>
            <Field label="Producto" name="product_id">
              <select name="product_id" required defaultValue="">
                <option value="" disabled>
                  Elige un producto
                </option>
                {must(products).map((p) => (
                  <option key={p.id} value={p.id}>
                    {productLabel(p)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cantidad" name="quantity" hint="En la unidad del producto (g, ml o unidad).">
              <input name="quantity" type="number" step="any" min="0" required />
            </Field>
            <Field label="Notas" name="notes" wide>
              <textarea name="notes" rows={1} />
            </Field>
            <div>
              <SubmitButton>Añadir ingrediente</SubmitButton>
            </div>
          </ActionForm>
        )}
      </section>

      <section className="card">
        <h2>Coste y nutrición</h2>
        <p>
          Lote a precios actuales:{" "}
          <CostCell value={c?.total_cost ?? null} missing={c?.ingredients_without_price ?? null} />
          {c?.cost_per_serving != null && <> · por ración: <CostCell value={c.cost_per_serving} missing={null} /></>}
        </p>
        <p className="muted">
          {f.servings ? `${num(f.servings)} raciones` : "Raciones sin indicar: nutrición del lote completo"}
          {f.serving_size && ` de ${num(f.serving_size)} ${label(units, f.serving_unit)}`}
        </p>
        {n && (
          <>
            <table>
              <tbody>
                {nutrients.map(([key, name, unit]) => (
                  <tr key={key}>
                    <th>{name}</th>
                    <td>
                      {num(n[key], 1)} {n[key] != null && unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!!n.ingredients_without_nutrition && (
              <p className="warning">
                {n.ingredients_without_nutrition} ingredientes sin ficha nutricional: los totales afectados quedan
                vacíos.
              </p>
            )}
          </>
        )}
      </section>

      <section className="card">
        <h2>Experimentos con esta versión</h2>
        {runs.length === 0 ? (
          <p className="muted">Ninguno.</p>
        ) : (
          <ul className="list-inside list-disc text-sm">
            {runs.map((e) => (
              <li key={e.id}>
                <Link href={`/projects/${projectId}/experiments/${e.id}`}>
                  {text(e.performed_on)} · {label(experimentStatus, e.status)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="card">
        <summary>Editar receta</summary>
        <ActionForm action={updateFormulation.bind(null, f.id)} className="form-grid">
          <FormulationFields formulation={f} />
          <div>
            <SubmitButton>Guardar</SubmitButton>
          </div>
        </ActionForm>
        {!frozen && (
          <ActionForm action={createVersion.bind(null, f.id)}>
            <SubmitButton className="btn btn-secondary">Crear versión nueva</SubmitButton>
          </ActionForm>
        )}
        <ActionForm
          action={deleteFormulation.bind(null, f.id, projectId)}
          confirm="¿Borrar esta versión de la receta? Solo se puede si no tiene experimentos."
        >
          <SubmitButton className="btn btn-danger">Borrar versión</SubmitButton>
        </ActionForm>
      </details>
    </>
  );
}
