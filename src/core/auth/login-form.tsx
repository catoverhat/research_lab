"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/shared/supabase/browser";
import { ActionForm, Field, SubmitButton } from "@/shared/ui/form";
import { signIn } from "./actions";
import { authMessage } from "./messages";

declare global {
  interface Window {
    turnstile?: {
      render(
        container: HTMLElement,
        options: { sitekey: string; language?: string; callback?: () => void; "error-callback"?: () => void },
      ): string;
      getResponse(widgetId: string): string | undefined;
      reset(widgetId: string): void;
      remove(widgetId: string): void;
    };
  }
}

export function LoginForm({ siteKey }: { siteKey: string }) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const [passkeyError, setPasskeyError] = useState<string>();
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);

  // Explicit rendering, so the widget also appears after a client-side navigation to /login.
  const renderWidget = () => {
    if (container.current && window.turnstile && widget.current === undefined)
      widget.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        language: "es",
        // A transient widget error recovers on its own: the next token clears the warning.
        callback: () => setCaptchaError(false),
        "error-callback": () => setCaptchaError(true),
      });
  };
  // A captcha token works once: every attempt needs a fresh one.
  const resetWidget = useCallback(() => {
    if (widget.current !== undefined) window.turnstile?.reset(widget.current);
  }, []);

  useEffect(
    () => () => {
      if (widget.current !== undefined) window.turnstile?.remove(widget.current);
      widget.current = undefined;
    },
    [],
  );

  async function signInWithPasskey() {
    setPasskeyPending(true);
    setPasskeyError(undefined);
    const captchaToken = widget.current !== undefined ? window.turnstile?.getResponse(widget.current) : undefined;
    const { error } = await createClient().auth.signInWithPasskey({ options: { captchaToken } });
    setPasskeyPending(false);
    if (error) {
      resetWidget();
      setPasskeyError(authMessage(error));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  if (!siteKey)
    return (
      <p role="alert" className="card text-sm text-red-700">
        Falta configurar NEXT_PUBLIC_TURNSTILE_SITE_KEY: sin ella no se puede iniciar sesión.
      </p>
    );

  return (
    <div className="card">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={renderWidget}
        onError={() => setCaptchaError(true)}
      />
      <ActionForm action={signIn} onState={resetWidget} className="space-y-3">
        <Field label="Email" name="email">
          <input name="email" type="email" autoComplete="username" spellCheck={false} required />
        </Field>
        <Field label="Contraseña" name="password">
          <input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <div ref={container} className="min-h-[65px]" />
        {captchaError && (
          <p role="alert" className="text-sm text-red-700">
            No se pudo cargar la verificación anti-bots (Cloudflare Turnstile). Recarga la página; si usas un
            bloqueador de contenido, permite este sitio.
          </p>
        )}
        <SubmitButton className="btn w-full">Entrar</SubmitButton>
      </ActionForm>
      <button type="button" className="btn btn-secondary w-full" onClick={signInWithPasskey} disabled={passkeyPending}>
        Entrar con passkey{passkeyPending && "…"}
      </button>
      {passkeyError && (
        <p role="alert" className="text-sm text-red-700">
          {passkeyError}
        </p>
      )}
    </div>
  );
}
