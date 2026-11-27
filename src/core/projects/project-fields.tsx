import type { Tables } from "@/shared/database/database.types";
import { Field } from "@/shared/ui/form";
import { Options } from "@/shared/ui/options";
import { projectStatus } from "./schema";

export function ProjectFields({ project }: { project?: Tables<"research_projects"> }) {
  return (
    <>
      <Field label="Título" name="title">
        <input name="title" required defaultValue={project?.title} />
      </Field>
      <Field label="Estado" name="status">
        <select name="status" defaultValue={project?.status ?? "active"}>
          <Options labels={projectStatus} />
        </select>
      </Field>
      <Field label="Objetivo" name="objective" wide>
        <textarea name="objective" rows={2} defaultValue={project?.objective ?? ""} />
      </Field>
      <Field label="Alcance" name="scope" wide>
        <textarea name="scope" rows={2} defaultValue={project?.scope ?? ""} />
      </Field>
    </>
  );
}
