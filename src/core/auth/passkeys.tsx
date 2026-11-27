"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/shared/supabase/browser";
import { authMessage } from "./messages";

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("es-DO") : "nunca");

// Passkey ceremonies need navigator.credentials, so this talks to Supabase Auth from the browser.
export function Passkeys() {
  const [passkeys, setPasskeys] = useState<Passkey[]>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const run = useCallback(async (operation: () => Promise<{ error: { message: string } | null }>) => {
    setPending(true);
    setError(undefined);
    const { error } = await operation();
    if (error) setError(authMessage(error));
    const list = await createClient().auth.passkey.list();
    if (list.error) setError(authMessage(list.error));
    else setPasskeys(list.data);
    setPending(false);
  }, []);

  useEffect(() => {
    run(async () => ({ error: null }));
  }, [run]);

  return (
    <div className="space-y-3">
      {passkeys?.length === 0 && <p className="muted">Aún no tienes passkeys.</p>}
      {passkeys && passkeys.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Creada</th>
              <th>Último uso</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {passkeys.map((p) => (
              <tr key={p.id}>
                <td>{p.friendly_name || "Passkey"}</td>
                <td>{when(p.created_at)}</td>
                <td>{when(p.last_used_at)}</td>
                <td className="text-right">
                  <button
                    className="btn btn-danger"
                    disabled={pending}
                    onClick={() =>
                      window.confirm("¿Borrar esta passkey?") &&
                      run(() => createClient().auth.passkey.delete({ passkeyId: p.id }))
                    }
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="btn" disabled={pending} onClick={() => run(() => createClient().auth.registerPasskey())}>
        Añadir passkey
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
