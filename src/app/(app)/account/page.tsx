import { updateName } from "@/core/auth/actions";
import { Passkeys } from "@/core/auth/passkeys";
import { savedNameOf, sessionClaims } from "@/core/auth/user";
import { requireUser } from "@/shared/supabase/server";
import { ActionForm, Field, SubmitButton } from "@/shared/ui/form";

export const metadata = { title: "Cuenta" };

export default async function AccountPage() {
  const supabase = await requireUser();
  const claims = await sessionClaims(supabase);
  const name = savedNameOf(claims);

  return (
    <>
      <h1>Cuenta</h1>
      <section className="card">
        <p className="muted">Sesión iniciada como {claims?.email}</p>
        <h2>Tu nombre</h2>
        <ActionForm action={updateName} className="form-grid">
          <Field
            label="Nombre"
            name="name"
            hint="Se propone como evaluador al registrar una evaluación sensorial. Vacío: se usa lo que va antes de la @ de tu email."
          >
            <input name="name" defaultValue={name ?? ""} autoComplete="name" maxLength={80} />
          </Field>
          <div>
            <SubmitButton>Guardar nombre</SubmitButton>
          </div>
        </ActionForm>
      </section>
      <section className="card">
        <h2>Passkeys</h2>
        <p className="muted">Entra con la huella, la cara o una llave de seguridad en vez de la contraseña.</p>
        <Passkeys />
      </section>
    </>
  );
}
