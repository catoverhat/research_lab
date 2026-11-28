import { z } from "zod";
import { oneOf, optionalId, requiredText } from "@/shared/forms";

// Glossary: "Nivel de evidencia".
export const evidenceLevel = {
  confirmed: "Confirmado",
  preliminary: "Preliminar",
  anecdotal: "Anecdótico",
};

// Glossary: "Hipótesis".
export const hypothesisStatus = {
  pending: "Pendiente",
  testing: "En prueba",
  supported: "Respaldada",
  refuted: "Refutada",
  inconclusive: "Inconclusa",
};

export const findingSchema = z.object({
  statement: requiredText,
  evidence_level: oneOf(evidenceLevel),
  hypothesis_id: optionalId,
});

export const hypothesisStatusSchema = z.object({ status: oneOf(hypothesisStatus) });
