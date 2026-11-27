import { z } from "zod";
import { nonNegativeNumber, oneOf, optionalBoolean, optionalText, positiveNumber, requiredText } from "@/shared/forms";

export const units = { g: "g", ml: "ml", unit: "unidad" };

export const productSchema = z.object({
  brand: optionalText,
  name: requiredText,
  package_size: positiveNumber,
  unit: oneOf(units),
  // Ingredient name; created on the fly when it doesn't exist yet.
  ingredient: optionalText,
  barcode: optionalText,
  notes: optionalText,
});

/** True when the product has prices or appears in recipes (rows from `product_prices(count), formulation_ingredients(count)`). */
export const productInUse = (p: { product_prices: { count: number }[]; formulation_ingredients: { count: number }[] }) =>
  (p.product_prices[0]?.count ?? 0) + (p.formulation_ingredients[0]?.count ?? 0) > 0;

// shortcut: no currency field, so every price takes the column default (DOP). The cost views add
// amounts without looking at the currency; allow others once they group by currency.
export const priceSchema = z.object({
  price: nonNegativeNumber,
  observed_on: z.iso.date("Fecha no válida"),
  // Supplier name; created on the fly when it doesn't exist yet.
  supplier: optionalText,
  in_stock: optionalBoolean,
  // The page where the price was seen. It is saved as a 'commercial' source.
  source_url: optionalText.pipe(z.url({ protocol: /^https?$/, error: "URL no válida" }).nullable()),
  notes: optionalText,
});
