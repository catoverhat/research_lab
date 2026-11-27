import { notFound } from "next/navigation";
import { updateProject } from "@/core/projects/actions";
import { ProjectFields } from "@/core/projects/project-fields";
import { projectStatus } from "@/core/projects/schema";
import { label } from "@/shared/format";
import { must, requireUser } from "@/shared/supabase/server";
import { ActionForm, SubmitButton } from "@/shared/ui/form";
import { ExperimentsSection } from "@/modules/food/experiments/experiments-section";
import { FormulationsSection } from "@/modules/food/formulations/formulations-section";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const supabase = await requireUser();
  const project = must(await supabase.from("research_projects").select("*").eq("id", projectId).maybeSingle());
  if (!project) notFound();

  return (
    <>
      <div className="space-y-1">
        <h1>
          {project.title} <span className="badge align-middle">{label(projectStatus, project.status)}</span>
        </h1>
        {project.objective && <p className="whitespace-pre-line">{project.objective}</p>}
        {project.scope && <p className="muted whitespace-pre-line">{project.scope}</p>}
      </div>
      <details className="card">
        <summary>Editar proyecto</summary>
        <ActionForm action={updateProject.bind(null, project.id)} className="form-grid">
          <ProjectFields project={project} />
          <div>
            <SubmitButton>Guardar</SubmitButton>
          </div>
        </ActionForm>
      </details>
      {/* Food module. Other research types will show their own sections here. */}
      <FormulationsSection supabase={supabase} projectId={project.id} />
      <ExperimentsSection supabase={supabase} projectId={project.id} />
    </>
  );
}
