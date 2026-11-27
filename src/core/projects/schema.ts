import { z } from "zod";
import { oneOf, optionalText, requiredText } from "@/shared/forms";

export const projectStatus = {
  planned: "Planificado",
  active: "Activo",
  paused: "En pausa",
  completed: "Terminado",
  archived: "Archivado",
};

export const projectSchema = z.object({
  title: requiredText,
  status: oneOf(projectStatus),
  objective: optionalText,
  scope: optionalText,
});
