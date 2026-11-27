import { z } from "zod";
import { units } from "@/core/products/schema";
import { oneOf, optionalPositiveNumber, optionalText, positiveNumber, requiredId, requiredText } from "@/shared/forms";

export const formulationStatus = {
  draft: "Borrador",
  proposed: "Propuesta",
  tested: "Probada",
  validated: "Validada",
  discarded: "Descartada",
};

const base = z.object({
  name: optionalText,
  status: oneOf(formulationStatus),
  servings: optionalPositiveNumber,
  serving_size: optionalPositiveNumber,
  serving_unit: z.union([z.literal("").transform(() => null), oneOf(units)]),
  instructions: optionalText,
  notes: optionalText,
});

const servingPair = (d: { serving_size: number | null; serving_unit: string | null }) =>
  (d.serving_size == null) === (d.serving_unit == null);
const servingPairError = {
  message: "Indica el tamaño de la ración y su unidad, o ninguno de los dos.",
  path: ["serving_size"],
};

export const formulationSchema = base.refine(servingPair, servingPairError);
export const newFormulationSchema = base.extend({ code: requiredText }).refine(servingPair, servingPairError);

export const ingredientSchema = z.object({
  product_id: requiredId,
  quantity: positiveNumber,
  notes: optionalText,
});

export const ingredientUpdateSchema = ingredientSchema.omit({ product_id: true });
