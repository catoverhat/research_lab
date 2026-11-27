import Link from "next/link";
import { createProduct } from "@/core/products/actions";
import { ProductFields } from "@/core/products/product-fields";
import { dash, date, money, productLabel, text, unitLabel } from "@/shared/format";
import { must, requireUser } from "@/shared/supabase/server";
import { ActionForm, SubmitButton } from "@/shared/ui/form";

export const metadata = { title: "Productos" };

export default async function ProductsPage() {
  const supabase = await requireUser();
  const [productsResult, latest, ingredients] = await Promise.all([
    supabase
      .from("products")
      .select("id, brand, name, package_size, unit, ingredients(name)")
      .order("brand")
      .order("name"),
    supabase.from("v_product_unit_cost").select("product_id, price, currency, observed_on, supplier, unit_cost"),
    supabase.from("ingredients").select("name").order("name"),
  ]);
  const products = must(productsResult);
  const latestByProduct = new Map(must(latest).map((p) => [p.product_id, p]));

  return (
    <>
      <h1>Productos</h1>
      {products.length === 0 ? (
        <p className="muted">Aún no hay productos. Crea el primero con «Nuevo producto».</p>
      ) : (
        <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Ingrediente</th>
              <th>Último precio</th>
              <th>Coste por unidad</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const price = latestByProduct.get(p.id);
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/products/${p.id}`}>{productLabel(p)}</Link>
                  </td>
                  <td>{text(p.ingredients?.name)}</td>
                  <td>
                    {price ? (
                      <>
                        {money(price.price, price.currency ?? undefined)}
                        <span className="muted">
                          {" "}
                          · <span className="whitespace-nowrap">{date(price.observed_on)}</span>
                          {price.supplier && ` · ${price.supplier}`}
                        </span>
                      </>
                    ) : (
                      dash
                    )}
                  </td>
                  <td>
                    {price ? `${money(price.unit_cost, price.currency ?? undefined, 4)} / ${unitLabel(p.unit)}` : dash}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
      <details className="card">
        <summary>Nuevo producto</summary>
        <p className="muted">Una presentación concreta: 5 oz y 16 oz de la misma marca son dos productos.</p>
        <ActionForm action={createProduct} className="form-grid">
          <ProductFields ingredientNames={must(ingredients).map((i) => i.name)} />
          <div>
            <SubmitButton>Crear producto</SubmitButton>
          </div>
        </ActionForm>
      </details>
    </>
  );
}
