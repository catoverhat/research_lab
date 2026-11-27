"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { dbError, type FormState, parseForm } from "@/shared/forms";
import { type Client, requireUser } from "@/shared/supabase/server";
import { priceSchema, productSchema } from "./schema";

/**
 * Id of the ingredient with that name, creating it if needed (names are unique per owner).
 * If the product write after it fails, the ingredient stays: a reusable name, not half-written data.
 */
async function ingredientId(supabase: Client, name: string | null) {
  if (!name) return { id: null, error: null };
  const { data, error } = await supabase
    .from("ingredients")
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
  const ingredientRow = await ingredientId(supabase, ingredient);
  if (ingredientRow.error) return dbError(ingredientRow.error);

  const { data: row, error } = await supabase
    .from("products")
    .insert({ ...product, ingredient_id: ingredientRow.id })
    .select("id")
    .single();
  if (error) return dbError(error);
  redirect(`/products/${row.id}`);
}

// The database keeps the size and unit of a product in use (trigger lock_used_product_presentation).
export async function updateProduct(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(productSchema, formData);
  if (state) return state;

  const { ingredient, ...product } = data;
  const ingredientRow = await ingredientId(supabase, ingredient);
  if (ingredientRow.error) return dbError(ingredientRow.error);

  const { error } = await supabase
    .from("products")
    .update({ ...product, ingredient_id: ingredientRow.id })
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
// add_product_price stores the price, its supplier and its source in one transaction.
export async function addPrice(productId: string, _: FormState, formData: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const { data, state } = parseForm(priceSchema, formData);
  if (state) return state;

  const { error } = await supabase.rpc("add_product_price", {
    p_product_id: productId,
    p_price: data.price,
    p_observed_on: data.observed_on,
    // undefined leaves the SQL default (null): the argument is simply not sent.
    p_supplier: data.supplier ?? undefined,
    p_in_stock: data.in_stock ?? undefined,
    p_source_url: data.source_url ?? undefined,
    p_notes: data.notes ?? undefined,
  });
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}
