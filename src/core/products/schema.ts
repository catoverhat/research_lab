import { z } from "zod";
import {
  nonNegativeNumber,
  oneOf,
  optionalBoolean,
  optionalText,
  positiveNumber,
  requiredText,
} from "@/shared/forms";

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

export const priceSchema = z.object({
  price: nonNegativeNumber,
  currency: requiredText.toUpperCase().regex(/^[A-Z]{3}$/, "Código de 3 letras, p. ej. DOP"),
  observed_on: z.iso.date("Fecha no válida"),
  // Supplier name; created on the fly when it doesn't exist yet.
  supplier: optionalText,
  in_stock: optionalBoolean,
  // The page where the price was seen. It is saved as a 'commercial' source.
  source_url: optionalText.pipe(z.url({ protocol: /^https?$/, error: "URL no válida" }).nullable()),
  notes: optionalText,
});
