"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Link2, ShieldAlert, X } from "lucide-react";
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
                <svg fill="currentColor" className="h-5 w-5" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 335.08 335.079" xmlSpace="preserve">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <g>
                      <g>
                        <path d="M311.175,115.775c-1.355-10.186-1.546-27.73,7.915-33.621c0.169-0.108,0.295-0.264,0.443-0.398 c7.735-2.474,13.088-5.946,8.886-10.618l-114.102-34.38L29.56,62.445c0,0-21.157,3.024-19.267,35.894 c1.026,17.89,6.637,26.676,11.544,31l-15.161,4.569c-4.208,4.672,1.144,8.145,8.88,10.615c0.147,0.138,0.271,0.293,0.443,0.401 c9.455,5.896,9.273,23.438,7.913,33.626c-33.967,9.645-21.774,12.788-21.774,12.788l7.451,1.803 c-5.241,4.736-10.446,13.717-9.471,30.75c1.891,32.864,19.269,35.132,19.269,35.132l120.904,39.298l182.49-44.202 c0,0,12.197-3.148-21.779-12.794c-1.366-10.172-1.556-27.712,7.921-33.623c0.174-0.105,0.301-0.264,0.442-0.396 c7.736-2.474,13.084-5.943,8.881-10.615l-7.932-2.395c5.29-3.19,13.236-11.527,14.481-33.183 c0.859-14.896-3.027-23.62-7.525-28.756l15.678-3.794C332.949,128.569,345.146,125.421,311.175,115.775z M158.533,115.354 l30.688-6.307l103.708-21.312l15.451-3.178c-4.937,9.036-4.73,21.402-3.913,29.35c0.179,1.798,0.385,3.44,0.585,4.688 L288.14,122.8l-130.897,32.563L158.533,115.354z M26.71,147.337l15.449,3.178l99.597,20.474l8.701,1.782l0,0l0,0l26.093,5.363 l1.287,40.01L43.303,184.673l-13.263-3.296c0.195-1.25,0.401-2.89,0.588-4.693C31.44,168.742,31.651,156.373,26.71,147.337z M20.708,96.757c-0.187-8.743,1.371-15.066,4.52-18.28c2.004-2.052,4.369-2.479,5.991-2.479c0.857,0,1.474,0.119,1.516,0.119 l79.607,25.953l39.717,12.949l-1.303,40.289L39.334,124.07l-5.88-1.647c-0.216-0.061-0.509-0.103-0.735-0.113 C32.26,122.277,21.244,121.263,20.708,96.757z M140.579,280.866L23.28,247.98c-0.217-0.063-0.507-0.105-0.733-0.116 c-0.467-0.031-11.488-1.044-12.021-25.544c-0.19-8.754,1.376-15.071,4.519-18.288c2.009-2.052,4.375-2.479,5.994-2.479 c0.859,0,1.474,0.115,1.519,0.115c0,0,0.005,0,0,0l119.316,38.908L140.579,280.866z M294.284,239.459 c0.185,1.804,0.391,3.443,0.591,4.693l-147.812,36.771l1.292-40.01l31.601-6.497l4.667,1.129l17.492-5.685l80.631-16.569 l15.457-3.18C293.261,219.146,293.466,231.517,294.284,239.459z M302.426,185.084c-0.269,0.006-0.538,0.042-0.791,0.122 l-11.148,3.121l-106.148,29.764l-1.298-40.289l34.826-11.359l84.327-27.501c0.011-0.005,4.436-0.988,7.684,2.315 c3.144,3.214,4.704,9.537,4.52,18.28C313.848,184.035,302.827,185.053,302.426,185.084z"></path>
                      </g>
                    </g>
                  </g>
                </svg>
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
