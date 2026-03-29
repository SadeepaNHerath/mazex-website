"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  Handshake,
  Image as ImageIcon,
  Link2,
  ShieldAlert,
  Trash2,
  Type,
  X,
} from "lucide-react";
import {
  createSponsorAction,
  deleteSponsorAction,
  type UpdateAdminSponsorsState,
} from "@/app/admin/sponsors/actions";
import type { PublicSponsor } from "@/lib/sponsor-types";

const initialUpdateAdminSponsorsState: UpdateAdminSponsorsState = {
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
      className="theme-button inline-flex w-full cursor-pointer items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Adding..." : "Add sponsor"}
    </button>
  );
}

function DeleteSponsorButton({ sponsorId }: { sponsorId: string }) {
  const [state, formAction] = useActionState(
    deleteSponsorAction,
    initialUpdateAdminSponsorsState,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="sponsorId" value={sponsorId} />
      <DeleteButton />
      {state.status === "error" && state.message ? (
        <p className="text-xs text-rose-300">{state.message}</p>
      ) : null}
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="admin-button-secondary inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Removing..." : "Remove"}
    </button>
  );
}

export default function AdminSponsorsForm({
  sponsors,
}: {
  sponsors: PublicSponsor[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [lastSelectionAt, setLastSelectionAt] = useState(0);
  const [state, formAction] = useActionState(
    createSponsorAction,
    initialUpdateAdminSponsorsState,
  );

  const activeToastId =
    state.message && state.status !== "idle"
      ? `${state.status}:${state.toastKey}`
      : null;

  function syncSelectedFileToInput(
    input: HTMLInputElement | null,
    file: File | null,
  ) {
    if (!input) {
      return;
    }

    if (!file) {
      input.value = "";
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
  }

  function handleImageInputRef(node: HTMLInputElement | null) {
    imageInputRef.current = node;
    syncSelectedFileToInput(node, selectedFile);
  }

  useEffect(() => {
    if (!activeToastId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissedToastId(activeToastId);
    }, 8000);

    return () => window.clearTimeout(timeoutId);
  }, [activeToastId]);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, [previewUrl, state.status, state.toastKey]);

  useEffect(() => {
    syncSelectedFileToInput(imageInputRef.current, selectedFile);
  }, [selectedFile, state.toastKey]);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTitle("");
      setWebsiteUrl("");
      setSortOrder("0");
      setSelectedFile(null);
      setPreviewUrl(null);
      setPreviewName(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [state.status, state.toastKey]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updatePreview(file: File | null) {
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return file ? URL.createObjectURL(file) : null;
    });
    setPreviewName(file ? file.name : null);
  }

  function handleImageSelection(file: File | null) {
    if (!file) {
      setSelectedFile(null);
      updatePreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    setLastSelectionAt(Date.now());
    setSelectedFile(file);
    updatePreview(file);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    handleImageSelection(file);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (imageInputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      imageInputRef.current.files = transfer.files;
    }

    handleImageSelection(file);
  }

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
  const latestSuccessAt = state.status === "success" ? state.toastKey : 0;
  const showPreview = Boolean(previewUrl) && lastSelectionAt > latestSuccessAt;
  const previewSrc = showPreview ? previewUrl : null;

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

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="admin-panel p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="theme-chip text-[11px] font-bold uppercase tracking-[0.28em]">
              Manage Partners
            </div>
          </div>

          <div className="admin-panel-subtle mt-8 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-accent)]">
                <Handshake className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--admin-text)]">
                  Sponsor requirements
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
                  Upload a logo image, add the sponsor title shown under it, and
                  optionally include a website link for the Visit Website action.
                </p>
              </div>
            </div>
          </div>

          <form ref={formRef} action={formAction} className="mt-8 space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-[var(--admin-text)]"
                >
                  Sponsor title
                </label>

                <div className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-[var(--admin-border-strong)] focus-within:shadow-[0_0_0_3px_var(--admin-accent-soft)]">
                  <Type className="h-4.5 w-4.5 shrink-0 text-[var(--admin-muted)]" />
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Title Partner"
                    className="h-full w-full border-0 bg-transparent py-4 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label
                  htmlFor="websiteUrl"
                  className="block text-sm font-medium text-[var(--admin-text)]"
                >
                  Website link
                  <span className="ml-2 text-xs font-normal text-[var(--admin-muted)]">
                    Optional
                  </span>
                </label>

                <div className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-[var(--admin-border-strong)] focus-within:shadow-[0_0_0_3px_var(--admin-accent-soft)]">
                  <Link2 className="h-4.5 w-4.5 shrink-0 text-[var(--admin-muted)]" />
                  <input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="url"
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder="https://example.com"
                    className="h-full w-full border-0 bg-transparent py-4 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-[var(--admin-text)]"
              >
                Sort order
                <span className="ml-2 text-xs font-normal text-[var(--admin-muted)]">
                  (order in which displayed in home)
                </span>
              </label>

              <div className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-[var(--admin-border-strong)] focus-within:shadow-[0_0_0_3px_var(--admin-accent-soft)]">
                <Type className="h-4.5 w-4.5 shrink-0 text-[var(--admin-muted)]" />
                <input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  placeholder="0"
                  className="h-full w-full border-0 bg-transparent py-4 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="image"
                className="block text-sm font-medium text-[var(--admin-text)]"
              >
                Sponsor image
              </label>

              <label
                htmlFor="image"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`block cursor-pointer rounded-2xl border border-dashed p-4 transition ${
                  isDragging
                    ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]/10"
                    : "border-[var(--admin-border-strong)] bg-[var(--admin-surface)]"
                }`}
              >
                <div className="flex items-center gap-3 text-sm text-[var(--admin-muted)]">
                  <ImageIcon className="h-4.5 w-4.5 shrink-0" />
                  Drag and drop a logo here, or click to browse.
                </div>
                <p className="mt-2 text-xs text-[var(--admin-muted)]">
                  PNG, JPG, SVG, WebP, GIF, or AVIF up to 10MB.
                </p>

                {previewSrc ? (
                  <div className="mt-4 rounded-2xl border border-[var(--admin-border)] bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--admin-muted)]">
                      Preview
                    </p>
                    <div className="mt-3 flex min-h-28 items-center justify-center rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewSrc}
                        alt="Sponsor preview"
                        className="max-h-20 w-full object-contain"
                      />
                    </div>
                    {previewName ? (
                      <p className="mt-3 truncate text-sm text-[var(--admin-text)]">
                        {previewName}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <input
                  ref={handleImageInputRef}
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </label>
            </div>

            <SubmitButton />
          </form>
        </div>

        <div className="admin-panel p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
                Current sponsors
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
                These logos are rendered in the homepage Official Partners
                section.
              </p>
            </div>
            <div className="theme-chip w-fit text-[11px] font-bold uppercase tracking-[0.28em]">
              {sponsors.length} total
            </div>
          </div>

          {sponsors.length > 0 ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="admin-panel-subtle flex h-full flex-col rounded-3xl p-5"
                >
                  <div className="flex min-h-28 items-center justify-center rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sponsor.imageSrc}
                      alt={`${sponsor.title} logo`}
                      className="max-h-16 w-full object-contain"
                    />
                  </div>

                  <div className="mt-5 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--admin-muted)]">
                      Sponsor title
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--admin-text)]">
                      {sponsor.title}
                    </p>

                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--admin-muted)]">
                      Website
                    </p>
                    {sponsor.websiteUrl ? (
                      <a
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-sm text-[var(--admin-accent)] hover:text-[var(--admin-text)]"
                      >
                        {sponsor.websiteUrl}
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--admin-muted)]">
                        No website link
                      </p>
                    )}

                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--admin-muted)]">
                      Sort order
                    </p>
                    <p className="mt-2 text-sm text-[var(--admin-text)]">
                      {sponsor.sortOrder}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-[var(--admin-border)] pt-4">
                    <DeleteSponsorButton sponsorId={sponsor.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-panel-subtle mt-8 rounded-3xl p-8 text-center">
              <p className="text-base font-medium text-[var(--admin-text)]">
                No sponsors added yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
                Add your first sponsor above to populate the homepage section.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
