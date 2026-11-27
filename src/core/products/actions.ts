"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { productLabel } from "@/shared/format";
import { dbError, type FormState, parseForm } from "@/shared/forms";
import { type Client, requireUser } from "@/shared/supabase/server";
import { priceSchema, productInUse, productSchema } from "./schema";

/** Id of the ingredient or supplier with that name, creating it if needed. Names are unique per owner. */
async function idForName(supabase: Client, table: "ingredients" | "suppliers", name: string | null) {
  if (!name) return { id: null, error: null };
  const { data, error } = await supabase
    .from(table)
    .upsert({ name }, { onConflict: "owner_id,name" })
    .select("id")
    .single();
  return { id: data?.id ?? null, error };
}

export async function createProduct(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(productSchema, formData);
  if (state) return state;

  const { ingredient, ...product } = data;
  const ingredientId = await idForName(supabase, "ingredients", ingredient);
  if (ingredientId.error) return dbError(ingredientId.error);

  const { data: row, error } = await supabase
    .from("products")
    .insert({ ...product, ingredient_id: ingredientId.id })
    .select("id")
    .single();
  if (error) return dbError(error);
  redirect(`/products/${row.id}`);
}

export async function updateProduct(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(productSchema, formData);
  if (state) return state;

  const { ingredient, ...product } = data;
  const current = await supabase
    .from("products")
    .select("unit, package_size, product_prices(count), formulation_ingredients(count)")
    .eq("id", id)
    .single();
  if (current.error) return dbError(current.error);
  // Prices are per package and recipe quantities are in its unit: changing either rewrites history.
  if (
    productInUse(current.data) &&
    (current.data.unit !== product.unit || current.data.package_size !== product.package_size)
  )
    return {
      error: "Este producto ya tiene precios o está en recetas: su tamaño y unidad no cambian. Crea otro producto para esa presentación.",
    };

  const ingredientId = await idForName(supabase, "ingredients", ingredient);
  if (ingredientId.error) return dbError(ingredientId.error);

  const { error } = await supabase
    .from("products")
    .update({ ...product, ingredient_id: ingredientId.id })
    .eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<FormState> {
  const supabase = await requireUser();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return dbError(error);
  redirect("/products");
}

// Prices are append-only: there is no update or delete action on purpose.
export async function addPrice(productId: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(priceSchema, formData);
  if (state) return state;

  const { supplier, source_url, ...price } = data;
  const supplierId = await idForName(supabase, "suppliers", supplier);
  if (supplierId.error) return dbError(supplierId.error);

  let sourceId: string | null = null;
  if (source_url) {
    const { data: product, error } = await supabase
      .from("products")
      .select("brand, name, package_size, unit")
      .eq("id", productId)
      .single();
    if (error) return dbError(error);
    const source = await supabase
      .from("sources")
      .insert({
        kind: "commercial",
        title: `${supplier ?? "Precio"}: ${productLabel(product)}`,
        url: source_url,
        accessed_on: price.observed_on,
      })
      .select("id")
      .single();
    if (source.error) return dbError(source.error);
    sourceId = source.data.id;
  }

  const { error } = await supabase
    .from("product_prices")
    .insert({ ...price, product_id: productId, supplier_id: supplierId.id, source_id: sourceId });
  if (error) {
    // shortcut: two requests, not a transaction; undo the source by hand. Move to an RPC if this grows.
    if (sourceId) await supabase.from("sources").delete().eq("id", sourceId);
    return dbError(error);
  }
  refresh();
  return { ok: true };
}
