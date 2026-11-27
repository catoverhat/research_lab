/** Message for a Supabase Auth error (password or passkey). */
export function authMessage(error: { code?: string; name?: string; message: string }) {
  switch (error.code) {
    case "invalid_credentials":
      return "Email o contraseña incorrectos.";
    case "captcha_failed":
      return "Falló la verificación anti-bots. Espera a que se complete e inténtalo otra vez.";
    case "over_request_rate_limit":
      return "Demasiados intentos. Espera unos minutos.";
    case "webauthn_credential_not_found":
      return "Esa passkey no está registrada en esta cuenta.";
    case "webauthn_credential_exists":
      return "Esa passkey ya está registrada.";
    case "webauthn_challenge_expired":
      return "La solicitud caducó. Inténtalo otra vez.";
    case "passkey_disabled":
      return "Las passkeys no están activadas en Supabase.";
  }
  // The browser rejects with NotAllowedError when the user cancels the passkey prompt.
  if (error.name === "NotAllowedError" || /NotAllowedError|cancel/i.test(error.message)) return "Operación cancelada.";
  return `No se pudo completar: ${error.message}`;
}
