"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/shared/forms";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const FieldErrors = createContext<Record<string, string[] | undefined> | undefined>(undefined);

export function ActionForm({
  action,
  children,
  className,
  confirm,
  resetOnSuccess,
  onState,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  /** Asks before submitting (deletes). */
  confirm?: string;
  resetOnSuccess?: boolean;
  onState?: (state: FormState) => void;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
    if (state) onState?.(state);
  }, [state, resetOnSuccess, onState]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      // Submitting through a transition keeps what was typed when the server rejects it
      // (React resets uncontrolled fields after a plain form action).
      onSubmit={(event) => {
        event.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <FieldErrors value={state?.fieldErrors}>{children}</FieldErrors>
      {state?.error && (
        <p role="alert" className="text-sm text-red-700 sm:col-span-full">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function Field({
  label,
  name,
  hint,
  wide,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  /** Spans the whole form grid (textareas). */
  wide?: boolean;
  children: ReactNode;
}) {
  const errors = useContext(FieldErrors)?.[name];
  return (
    <label className={wide ? "field sm:col-span-full" : "field"}>
      <span className="font-medium">{label}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
      {errors && <small className="text-red-700">{errors.join(" ")}</small>}
    </label>
  );
}

export function SubmitButton({ children, className = "btn" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {children}
      {pending && "…"}
    </button>
  );
}
