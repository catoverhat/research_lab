export const dash = "—";

export const money = (value: number | null | undefined, currency = "DOP", digits = 2) =>
  value == null
    ? dash
    : new Intl.NumberFormat("es-DO", { style: "currency", currency, maximumFractionDigits: digits }).format(value);

export const num = (value: number | null | undefined, digits = 2) =>
  value == null ? dash : new Intl.NumberFormat("es-DO", { maximumFractionDigits: digits }).format(value);

export const text = (value: string | null | undefined) => value || dash;

/** Label for a stored code ("draft" -> "Borrador"); unknown codes show as they are. */
export const label = (labels: Record<string, string>, value: string | null) =>
  value == null ? dash : (labels[value] ?? value);

// Prices and experiments are recorded in the Dominican Republic: "today" is the local day there.
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Santo_Domingo" });

/** "Munné Chocolate 453.6 g" */
export const productLabel = (p: { brand: string | null; name: string; package_size: number; unit: string }) =>
  [p.brand, p.name, `${num(p.package_size, 1)} ${p.unit}`].filter(Boolean).join(" ");
