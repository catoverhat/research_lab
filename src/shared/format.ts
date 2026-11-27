export const dash = "—";

export const money = (value: number | null | undefined, currency = "DOP", digits = 2) =>
  value == null
    ? dash
    : new Intl.NumberFormat("es-DO", { style: "currency", currency, maximumFractionDigits: digits }).format(value);

export const num = (value: number | null | undefined, digits = 2) =>
  value == null ? dash : new Intl.NumberFormat("es-DO", { maximumFractionDigits: digits }).format(value);

export const text = (value: string | null | undefined) => value || dash;

// A stored date ("2026-11-27") is a calendar day, so it is read and shown in UTC to keep the same day.
const dayFormat = new Intl.DateTimeFormat("es-DO", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });

/** "2026-11-27" -> "27/11/2026"; null -> the fallback ("—" unless given); anything else as it came. */
export const date = (value: string | null | undefined, fallback = dash) => {
  if (!value) return fallback;
  const day = new Date(value);
  return Number.isNaN(day.getTime()) ? value : dayFormat.format(day);
};

/** Label for a stored code ("draft" -> "Borrador"); unknown codes show as they are. */
export const label = (labels: Record<string, string>, value: string | null) =>
  value == null ? dash : (labels[value] ?? value);

// Prices and experiments are recorded in the Dominican Republic: "today" is the local day there.
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Santo_Domingo" });

/** The stored unit as shown: g, ml or "ud." (the database says "unit"). */
export const unitLabel = (unit: string | null | undefined) => (unit === "unit" ? "ud." : (unit ?? dash));

/** "Munné Chocolate 453.6 g" */
export const productLabel = (p: { brand: string | null; name: string; package_size: number; unit: string }) =>
  [p.brand, p.name, `${num(p.package_size, 1)} ${unitLabel(p.unit)}`].filter(Boolean).join(" ");

/** "falta 1 precio" / "faltan 3 precios" */
export const missing = (n: number, noun: string) => (n === 1 ? `falta 1 ${noun}` : `faltan ${n} ${noun}s`);
