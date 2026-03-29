"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, KeyRound, ShieldAlert, X } from "lucide-react";
import {
  changeAdminPasswordAction,
  type ChangeAdminPasswordState,
} from "@/app/admin/actions";

const initialState: ChangeAdminPasswordState = {
  error: null,
  toastKey: 0,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="admin-button-secondary inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Changing password..." : "Change password"}
    </button>
  );
}

function Field({
  id,
  label,
  name,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--admin-text)]"
      >
        {label}
      </label>

      <div className="flex h-[52px] items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-[var(--admin-border-strong)] focus-within:shadow-[0_0_0_3px_var(--admin-accent-soft)]">
        <KeyRound className="h-4.5 w-4.5 shrink-0 text-[var(--admin-muted)]" />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-full border-0 bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--admin-muted)] transition hover:bg-white/5 hover:text-[var(--admin-text)]"
        >
          {visible ? (
            <EyeOff className="h-4.5 w-4.5" />
          ) : (
            <Eye className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null);
  const [state, formAction] = useActionState(
    changeAdminPasswordAction,
    initialState,
  );

  const activeToast = useMemo(
    () =>
      state.error
        ? {
            id: `error:${state.toastKey}`,
            message: state.error,
          }
        : null,
    [state.error, state.toastKey],
  );

  useEffect(() => {
    if (!activeToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedToastId(activeToast.id);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [activeToast]);

  const visibleToast =
    activeToast && activeToast.id !== dismissedToastId ? activeToast : null;

  return (
    <>
      {visibleToast ? (
        <div
          className="fixed top-24 right-4 left-4 z-50 mx-auto flex w-auto max-w-sm items-center gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:right-6 sm:left-auto"
          role="status"
          aria-live="polite"
        >
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          <p className="flex-1 pr-2 leading-5">{visibleToast.message}</p>
          <button
            type="button"
            onClick={() => setDismissedToastId(visibleToast.id)}
            aria-label="Close notification"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-current/80 transition hover:bg-white/10 hover:text-current"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-2xl">
        <div className="admin-panel p-6 sm:p-8">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">
              Settings
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--admin-text)]">
              Change password
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--admin-subtle)]">
              Enter your current password, set a new one, and confirm it. After
              the password changes successfully, the current admin session will
              be signed out automatically and redirected to the login page.
            </p>
          </div>

          <form action={formAction} className="mt-8 space-y-5">
            <Field
              id="currentPassword"
              label="Current password"
              name="currentPassword"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <Field
              id="newPassword"
              label="New password"
              name="newPassword"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
            <Field
              id="confirmPassword"
              label="Confirm new password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />

            <SubmitButton />
          </form>
        </div>
      </div>
    </>
  );
}
