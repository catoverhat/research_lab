"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
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

  // Only when a new result arrives: re-running on other changes would steal the focus while typing.
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
    // After a rejected submit, take the keyboard and screen reader to the first field to fix.
    if (state?.fieldErrors) ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state, resetOnSuccess]);

  useEffect(() => {
    if (state) onState?.(state);
  }, [state, onState]);

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
      {state?.ok && (
        <p role="status" className="text-sm text-green-800 sm:col-span-full">
          Guardado.
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
  /** One control (input, select or textarea): it gets aria-invalid and points to its error. */
  children: ReactNode;
}) {
  const errors = useContext(FieldErrors)?.[name];
  const id = useId();
  // The label names the control; hint and error describe it (outside the label, so they are read once).
  const describedBy = [hint && `${id}-hint`, errors && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, { id, "aria-describedby": describedBy, "aria-invalid": errors ? true : undefined })
    : children;
  return (
    <div className={wide ? "field sm:col-span-full" : "field"}>
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {control}
      {hint && (
        <small id={`${id}-hint`} className="muted">
          {hint}
        </small>
      )}
      {errors && (
        <small id={`${id}-error`} className="text-red-700">
          {errors.join(" ")}
        </small>
      )}
    </div>
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
