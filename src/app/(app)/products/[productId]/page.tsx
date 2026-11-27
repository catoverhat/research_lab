import Link from "next/link";
import { notFound } from "next/navigation";
import { addPrice, deleteProduct, updateProduct } from "@/core/products/actions";
import { ProductFields } from "@/core/products/product-fields";
import { productInUse } from "@/core/products/schema";
import { dash, date, money, productLabel, text, today, unitLabel } from "@/shared/format";
import { must, requireUser } from "@/shared/supabase/server";
import { ActionForm, Field, SubmitButton } from "@/shared/ui/form";

export const metadata = { title: "Producto" };

const stock = (value: boolean | null) => (value == null ? dash : value ? "Sí" : "No");

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const supabase = await requireUser();
  const [product, history, extras, ingredients, suppliers] = await Promise.all([
    supabase
      .from("products")
      .select("*, ingredients(name), product_prices(count), formulation_ingredients(count)")
      .eq("id", productId)
      .maybeSingle(),
    supabase
      .from("v_price_history")
      .select("price_id, price, currency, observed_on, supplier, in_stock, unit_cost")
      .eq("product_id", productId)
      .order("observed_on", { ascending: false })
      .order("created_at", { ascending: false })
      .order("price_id"),
    // The view has no notes or source; fetch them per price.
    supabase.from("product_prices").select("id, notes, sources(url)").eq("product_id", productId),
    supabase.from("ingredients").select("name").order("name"),
    supabase.from("suppliers").select("name").order("name"),
  ]);
  const p = must(product);
  if (!p) notFound();
  const prices = must(history);
  const extrasById = new Map(must(extras).map((e) => [e.id, e]));
  const latest = prices[0];

  return (
    <>
      <p className="muted">
        <Link href="/products">Productos</Link>
      </p>
      <h1>{productLabel(p)}</h1>

      <section className="card">
        <h2>Precios</h2>
        {prices.length === 0 ? (
          <p className="muted">Sin precios registrados.</p>
        ) : (
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Precio</th>
                <th>Por {unitLabel(p.unit)}</th>
                <th>Proveedor</th>
                <th>Disponible</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((h) => {
                const extra = h.price_id ? extrasById.get(h.price_id) : undefined;
                const url = extra?.sources?.url;
                return (
                  <tr key={h.price_id}>
                    <td className="whitespace-nowrap">{date(h.observed_on)}</td>
                    <td>{money(h.price, h.currency ?? undefined)}</td>
                    <td>{money(h.unit_cost, h.currency ?? undefined, 4)}</td>
                    <td>
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer">
                          {text(h.supplier)}
                        </a>
                      ) : (
                        text(h.supplier)
                      )}
                    </td>
                    <td>{stock(h.in_stock)}</td>
                    <td className="whitespace-pre-line">{text(extra?.notes)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
        <h3>Añadir precio</h3>
        <p className="muted">Los precios no se editan: cada observación es una fila nueva.</p>
        <ActionForm action={addPrice.bind(null, p.id)} className="form-grid" resetOnSuccess>
          <Field label="Precio (RD$)" name="price">
            <input name="price" type="number" step="0.01" min="0" required />
          </Field>
          <Field label="Fecha" name="observed_on">
            <input name="observed_on" type="date" required defaultValue={today()} />
          </Field>
          <Field label="Proveedor" name="supplier">
            <input name="supplier" list="supplier-names" autoComplete="off" defaultValue={latest?.supplier ?? ""} />
          </Field>
          <datalist id="supplier-names">
            {must(suppliers).map((s) => (
              <option key={s.name} value={s.name} />
            ))}
          </datalist>
          <Field label="Disponible" name="in_stock">
            <select name="in_stock" defaultValue="">
              <option value="">No consta</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </Field>
          <Field label="URL donde se vio" name="source_url" hint="Se guarda como fuente comercial.">
            <input name="source_url" type="url" />
          </Field>
          <Field label="Notas" name="notes" wide hint="Por ejemplo: Precio especial RD$ 200 (habitual arriba).">
            <textarea name="notes" rows={2} />
          </Field>
          <div>
            <SubmitButton>Añadir precio</SubmitButton>
          </div>
        </ActionForm>
      </section>

      <details className="card">
        <summary>Editar producto</summary>
        <ActionForm action={updateProduct.bind(null, p.id)} className="form-grid">
          <ProductFields
            product={p}
            ingredient={p.ingredients?.name}
            ingredientNames={must(ingredients).map((i) => i.name)}
            locked={productInUse(p)}
          />
          <div>
            <SubmitButton>Guardar</SubmitButton>
          </div>
        </ActionForm>
        <ActionForm
          action={deleteProduct.bind(null, p.id)}
          className="danger-zone"
          confirm="¿Borrar este producto? Se borrarán también su historial de precios y su ficha nutricional."
        >
          <SubmitButton className="btn btn-danger">Borrar producto</SubmitButton>
        </ActionForm>
      </details>
    </>
  );
}
