"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { BookOpenText, CheckCircle2, Link2, ShieldAlert, X } from "lucide-react";
import {
  updateAdminResourcesAction,
  type UpdateAdminResourcesState,
} from "@/app/admin/resources/actions";

const initialUpdateAdminResourcesState: UpdateAdminResourcesState = {
  status: "idle",
  message: null,
  toastKey: 0,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="theme-button inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Saving..." : "Save resource"}
    </button>
  );
}

export default function AdminResourcesForm({
  delegateBooklet,
}: {
  delegateBooklet: string;
}) {
  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null);
  const [state, formAction] = useActionState(
    updateAdminResourcesAction,
    initialUpdateAdminResourcesState,
  );

  const activeToastId =
    state.message && state.status !== "idle"
      ? `${state.status}:${state.toastKey}`
      : null;

  useEffect(() => {
    if (!activeToastId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedToastId(activeToastId);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [activeToastId]);

  const visibleToast =
    state.message &&
    state.status !== "idle" &&
    activeToastId !== dismissedToastId
      ? {
          id: activeToastId,
          message: state.message,
          status: state.status,
        }
      : null;
  const isSuccessToast = visibleToast?.status === "success";

  return (
    <>
      {visibleToast ? (
        <div
          className={`fixed top-24 right-4 left-4 z-50 mx-auto flex w-auto max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:right-6 sm:left-auto ${
            isSuccessToast
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-50"
              : "border-rose-500/25 bg-rose-500/10 text-rose-100"
          }`}
          role="status"
          aria-live="polite"
        >
          {isSuccessToast ? (
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          ) : (
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          )}
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

      <div className="mx-auto w-full max-w-3xl">
        <div className="admin-panel p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="theme-chip text-[11px] font-bold uppercase tracking-[0.28em]">
              Resources
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--admin-text)]">
              Update event resources
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--admin-subtle)]">
              Manage downloadable resources that appear on the public MazeX site.
              The delegate booklet link below powers the booklet button in the
              delegates section.
            </p>
          </div>

          <div className="admin-panel-subtle mt-8 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-accent)]">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--admin-text)]">
                  Delegate booklet
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
                  Accepts an external PDF URL or a site path like
                  {" "}
                  <span className="font-mono text-[var(--admin-subtle)]">
                    /downloads/Delegate_booklet_dummy.pdf
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          <form action={formAction} className="mt-8 space-y-5">
            <div className="space-y-3">
              <label
                htmlFor="delegateBooklet"
                className="block text-sm font-medium text-[var(--admin-text)]"
              >
                Delegate booklet URL
              </label>

              <div className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-[var(--admin-border-strong)] focus-within:shadow-[0_0_0_3px_var(--admin-accent-soft)]">
                <Link2 className="h-4.5 w-4.5 shrink-0 text-[var(--admin-muted)]" />
                <input
                  id="delegateBooklet"
                  name="delegateBooklet"
                  type="text"
                  defaultValue={delegateBooklet}
                  placeholder="https://example.com/delegate-booklet.pdf"
                  className="h-full w-full border-0 bg-transparent py-4 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
                />
              </div>
            </div>

            <SubmitButton />
          </form>
        </div>
      </div>
    </>
  );
}
