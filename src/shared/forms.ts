import { z } from "zod";

export type FormState =
  | { ok?: boolean; error?: string; fieldErrors?: Record<string, string[] | undefined> }
  | undefined;

const text = z.string().trim();
const number = z.number("Número no válido");

// Empty input means "unknown": it is stored as null, never as "" or 0.
const blankToNull = text.transform((v) => v || null);
export const optionalText = blankToNull;
export const requiredText = text.min(1, "Obligatorio");
export const requiredNumber = text.min(1, "Obligatorio").transform(Number);
export const positiveNumber = requiredNumber.pipe(number.positive("Debe ser mayor que 0"));
export const nonNegativeNumber = requiredNumber.pipe(number.min(0, "No puede ser negativo"));
export const optionalPositiveNumber = text
  .transform((v) => (v === "" ? null : Number(v)))
  .pipe(number.positive("Debe ser mayor que 0").nullable());
export const optionalDate = blankToNull.pipe(z.iso.date("Fecha no válida").nullable());
export const optionalId = blankToNull.pipe(z.guid("Selección no válida").nullable());
export const requiredId = z.guid("Selecciona una opción");
export const optionalBoolean = z.enum(["", "true", "false"]).transform((v) => (v === "" ? null : v === "true"));

/** Enum schema from a value -> label map, so the options and the validation share one list. */
export const oneOf = <T extends Record<string, string>>(labels: T) =>
  z.enum(Object.keys(labels) as [keyof T & string, ...(keyof T & string)[]], "Opción no válida");

export function parseForm<T extends z.ZodType>(schema: T, formData: FormData) {
  const result = schema.safeParse(Object.fromEntries(formData));
  if (result.success) return { data: result.data as z.output<T>, state: undefined };
  const state: FormState = {
    error: "Revisa los campos marcados.",
    fieldErrors: z.flattenError(result.error).fieldErrors as Record<string, string[]>,
  };
  return { data: undefined, state };
}

/** Turns a PostgREST error into a message for the form. */
export function dbError(error: { code?: string; message: string }): NonNullable<FormState> {
  switch (error.code) {
    case "23505":
      return { error: "Ya existe un registro con esos datos." };
    case "23503":
      return {
        error: error.message.startsWith("update or delete")
          ? "No se puede borrar: otros registros dependen de este."
          : "Un registro seleccionado ya no existe.",
      };
    // Check violations raised by the domain triggers and constraints (supabase/tests/domain_rules.sql).
    case "23514":
      if (error.message.includes("recorded experiments"))
        return { error: "La receta tiene experimentos realizados: su composición está congelada. Crea una versión nueva." };
      if (error.message.includes("recorded experiment cannot"))
        return {
          error: "Un experimento realizado o fallido no vuelve a planificado ni a cancelado, ni cambia de receta. Si se registró por error, bórralo.",
        };
      if (error.message.includes("product has prices"))
        return {
          error: "Este producto ya tiene precios o está en recetas: su tamaño y unidad no cambian. Crea otro producto para esa presentación.",
        };
      if (error.message.includes("product_prices_currency_dop"))
        return { error: "Por ahora los precios solo se registran en DOP." };
      return { error: "Algún valor no cumple las reglas de la base de datos." };
    case "P0002":
      return { error: "El registro ya no existe o no es tuyo." };
    default:
      return { error: `No se pudo guardar: ${error.message}` };
  }
}
