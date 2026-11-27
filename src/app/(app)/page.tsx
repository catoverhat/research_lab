import Link from "next/link";
import { createProject } from "@/core/projects/actions";
import { ProjectFields } from "@/core/projects/project-fields";
import { projectStatus } from "@/core/projects/schema";
import { label, text } from "@/shared/format";
import { must, requireUser } from "@/shared/supabase/server";
import { ActionForm, SubmitButton } from "@/shared/ui/form";

export default async function ProjectsPage() {
  const supabase = await requireUser();
  const projects = must(
    await supabase.from("research_projects").select("id, title, status, objective").order("created_at", { ascending: false }),
  );

  return (
    <>
      <h1>Proyectos</h1>
      {projects.length === 0 ? (
        <p className="muted">Aún no hay proyectos.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Estado</th>
              <th>Objetivo</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/projects/${p.id}`}>{p.title}</Link>
                </td>
                <td>{label(projectStatus, p.status)}</td>
                <td>{text(p.objective)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <details className="card">
        <summary>Nuevo proyecto</summary>
        <ActionForm action={createProject} className="form-grid">
          <ProjectFields />
          <div>
            <SubmitButton>Crear proyecto</SubmitButton>
          </div>
        </ActionForm>
      </details>
    </>
  );
}
