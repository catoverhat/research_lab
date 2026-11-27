import { Passkeys } from "@/core/auth/passkeys";
import { requireUser } from "@/shared/supabase/server";

export default async function AccountPage() {
  const supabase = await requireUser();
  const { data } = await supabase.auth.getClaims();

  return (
    <>
      <h1>Cuenta</h1>
      <section className="card">
        <p className="muted">{data?.claims.email}</p>
        <h2>Passkeys</h2>
        <p className="muted">Entra con la huella, la cara o una llave de seguridad en vez de la contraseña.</p>
        <Passkeys />
      </section>
    </>
  );
}
