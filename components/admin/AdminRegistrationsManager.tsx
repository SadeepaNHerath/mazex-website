"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Reorder } from "framer-motion";
import {
  CheckCircle2, ExternalLink, FileImage, GripHorizontal,
  Loader2, Plus, Settings2, ShieldAlert, Trash2, X, ChevronDown,
} from "lucide-react";
import {
  createRegistrationFormAction,
  deleteFormBannerAction,
  deleteRegistrationFormAction,
  updateRegistrationFormSettingsAction,
  uploadFormBannerAction,
  bulkSaveRegistrationFieldsAction,
  type RegistrationAdminActionState,
} from "@/app/admin/registrations/actions";
import { formatOptionsForTextarea } from "@/lib/registration-display";
import type {
  FieldDefinition, FieldType, FieldScope,
  FormDefinition, FormWithFields,
} from "@/lib/registration-types";
import { MAX_REGISTRATION_FORMS, REGISTRATION_FORM_KINDS } from "@/lib/registration-types";

// ─── Constants ────────────────────────────────────────────────────────────────
const IDLE: RegistrationAdminActionState = { status: "idle", message: null, toastKey: 0 };

const TYPE_LABELS: Record<FieldType, string> = {
  text: "Short answer", textarea: "Paragraph", email: "Email",
  tel: "Phone", number: "Number", select: "Dropdown",
  radio: "Radio input", checkbox: "Checkbox", date: "Date",
  time: "Time", file: "File Upload",
};

const ALL_TYPES = Object.keys(TYPE_LABELS) as FieldType[];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function localDt(v: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ state, onClose }: { state: RegistrationAdminActionState; onClose: () => void }) {
  if (state.status === "idle" || !state.message) return null;
  const ok = state.status === "success";
  return (
    <div role="status" className={`fixed right-4 top-24 z-50 flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl sm:right-6 ${ok ? "border-emerald-500/25 bg-emerald-950/80 text-emerald-200" : "border-rose-500/25 bg-rose-950/80 text-rose-200"}`}>
      {ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
      <p className="flex-1">{state.message}</p>
      <button type="button" onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function useToast(state: RegistrationAdminActionState) {
  const [key, setKey] = useState<number | null>(null);
  const visible = state.status !== "idle" && state.message && state.toastKey !== key ? state : null;
  return { visible, dismiss: () => setKey(state.toastKey) };
}

// ─── Form Tabs Bar ────────────────────────────────────────────────────────────
function FormTabsBar({ forms, selectedId, canCreate, onNew }: {
  forms: FormDefinition[]; selectedId?: string; canCreate: boolean; onNew: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      {forms.map(f => (
        <Link key={f.id} href={`/admin/form-builder?form=${f.slug}`}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${f.id === selectedId ? "border-sky-500/40 bg-sky-500/15 text-sky-200" : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:text-[var(--admin-text)]"}`}>
          <span className={`h-2 w-2 rounded-full ${f.status === "open" ? "bg-emerald-400" : f.status === "draft" ? "bg-amber-400" : "bg-rose-400"}`} />
          {f.title}
        </Link>
      ))}
      {canCreate && (
        <button type="button" onClick={onNew}
          className="flex items-center gap-1.5 rounded-2xl border border-dashed border-[var(--admin-border)] px-4 py-2.5 text-sm text-[var(--admin-muted)] transition hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)]">
          <Plus className="h-4 w-4" /> New form
        </button>
      )}
    </div>
  );
}

// ─── Create Form Panel ────────────────────────────────────────────────────────
function CreateFormPanel({ formCount, onCancel }: { formCount: number; onCancel: () => void }) {
  const [state, dispatch] = useActionState(createRegistrationFormAction, IDLE);
  const toast = useToast(state);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");

  return (
    <>
      {toast.visible && <Toast state={toast.visible} onClose={toast.dismiss} />}
      <div className="mx-auto max-w-xl">
        <div className="overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <div className="h-2 w-full bg-gradient-to-r from-sky-500 to-violet-500" />
          <div className="p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--admin-text)]">Create registration form</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">{formCount} of {MAX_REGISTRATION_FORMS} forms used</p>
            <form action={dispatch} className="mt-6 space-y-4">
              <div>
                <input name="title" type="text" placeholder="Form title" value={title} required
                  onChange={e => { setTitle(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")); }}
                  className="w-full border-b border-[var(--admin-border)] bg-transparent pb-2 text-xl font-semibold text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)] focus:border-sky-400" />
              </div>
              <div>
                <select name="kind" className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none">
                  {REGISTRATION_FORM_KINDS.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]">
                  Slug — <span className="font-normal normal-case tracking-normal">yoursite.com/{slug || "…"}</span>
                </label>
                <input name="slug" type="text" value={slug} required
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+/, ""))}
                  className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none focus:border-sky-400" />
              </div>
              {state.status === "error" && <p className="text-sm text-rose-300">{state.message}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="theme-button rounded-2xl px-5 py-2.5 text-sm font-semibold">Create form</button>
                <button type="button" onClick={onCancel} className="admin-button-secondary rounded-2xl px-5 py-2.5 text-sm font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Banner upload ────────────────────────────────────────────────────────────
function BannerArea({ form, bannerUrl }: { form: FormDefinition; bannerUrl: string | null }) {
  const [uploadState, uploadDispatch] = useActionState(uploadFormBannerAction, IDLE);
  const [deleteState, deleteDispatch] = useActionState(deleteFormBannerAction, IDLE);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="relative overflow-hidden rounded-t-2xl">
      {bannerUrl ? (
        <div className="relative h-40 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <form action={uploadDispatch} ref={formRef}>
              <input type="hidden" name="formId" value={form.id} />
              <input ref={fileRef} type="file" name="banner" accept="image/*" className="hidden"
                onChange={() => formRef.current?.requestSubmit()} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="rounded-xl bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/60">
                Replace banner
              </button>
            </form>
            <form action={deleteDispatch}>
              <input type="hidden" name="formId" value={form.id} />
              <button type="submit" className="rounded-xl bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-rose-500/60">Remove</button>
            </form>
          </div>
        </div>
      ) : (
        <form action={uploadDispatch} ref={formRef}>
          <input type="hidden" name="formId" value={form.id} />
          <input ref={fileRef} type="file" name="banner" accept="image/*" className="hidden"
            onChange={() => formRef.current?.requestSubmit()} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex h-16 w-full items-center justify-center gap-2 bg-[var(--admin-surface-muted)] text-sm text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface)] hover:text-[var(--admin-text)]">
            <FileImage className="h-4 w-4" /> Add banner image
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Settings Panel (collapsible) ─────────────────────────────────────────────
function SettingsPanel({ form }: { form: FormWithFields }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slug, setSlug] = useState(form.slug);
  const [settingsState, settingsDispatch] = useActionState(updateRegistrationFormSettingsAction, IDLE);
  const [deleteState, deleteDispatch] = useActionState(deleteRegistrationFormAction, IDLE);
  const st = useToast(settingsState);
  const dt = useToast(deleteState);
  const toast = st.visible ?? dt.visible;

  const [formVersion, setFormVersion] = useState(form.id + ":" + form.slug);
  if (form.id + ":" + form.slug !== formVersion) {
    setFormVersion(form.id + ":" + form.slug);
    setSlug(form.slug);
    setConfirmDelete(false);
  }

  return (
    <>
      {toast && <Toast state={toast} onClose={st.visible ? st.dismiss : dt.dismiss} />}
      <div className="border-t border-[var(--admin-border)]">
        <button type="button" onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between px-6 py-3 text-sm font-medium text-[var(--admin-muted)] hover:text-[var(--admin-text)]">
          <span className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Form settings</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <form action={settingsDispatch} className="border-t border-[var(--admin-border)] px-6 pb-6 pt-4">
            <input type="hidden" name="formId" value={form.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]">Form Title</label>
                <input name="title" defaultValue={form.title} required
                  className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none focus:border-sky-400" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]">
                  Slug — <span className="font-normal normal-case">yoursite.com/{slug || "…"}</span>
                  <a href={`/${slug}`} target="_blank" className="ml-2 inline-flex text-sky-400 hover:text-sky-300"><ExternalLink className="h-3 w-3" /></a>
                </label>
                <input name="slug" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+/, ""))}
                  className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none focus:border-sky-400" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]">Status</label>
                <select name="status" defaultValue={form.status} className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none">
                  <option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]">Min / Max members</label>
                <div className="flex gap-2">
                  <input name="teamMinMembers" type="number" min={1} max={50} defaultValue={form.teamMinMembers} disabled={form.kind !== "competition"}
                    className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none disabled:opacity-40" />
                  <input name="teamMaxMembers" type="number" min={1} max={50} defaultValue={form.teamMaxMembers} disabled={form.kind !== "competition"}
                    className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none disabled:opacity-40" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]">Opens at</label>
                <input type="datetime-local" defaultValue={localDt(form.openAt)}
                  onChange={e => {
                    const hidden = e.target.nextElementSibling as HTMLInputElement;
                    hidden.value = e.target.value ? new Date(e.target.value).toISOString() : "";
                  }}
                  className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none" />
                <input type="hidden" name="openAt" defaultValue={form.openAt || ""} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]">Closes at</label>
                <input type="datetime-local" defaultValue={localDt(form.closeAt)}
                  onChange={e => {
                    const hidden = e.target.nextElementSibling as HTMLInputElement;
                    hidden.value = e.target.value ? new Date(e.target.value).toISOString() : "";
                  }}
                  className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none" />
                <input type="hidden" name="closeAt" defaultValue={form.closeAt || ""} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]">Description</label>
                <input name="description" type="text" defaultValue={form.description ?? ""}
                  className="h-10 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text)] outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]">Success message</label>
                <textarea name="successMessage" rows={3} defaultValue={form.successMessage ?? ""}
                  className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none" />
              </div>
            </div>

            {settingsState.status === "error" && <p className="mt-3 text-sm text-rose-300">{settingsState.message}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="submit" className="theme-button rounded-2xl px-5 py-2.5 text-sm font-semibold">Save settings</button>
              {confirmDelete ? (
                <form action={deleteDispatch} className="flex items-center gap-2">
                  <input type="hidden" name="formId" value={form.id} />
                  <span className="text-sm text-rose-300">Delete this form and all its data?</span>
                  <button type="submit" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500">Yes, delete</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="admin-button-secondary rounded-xl px-4 py-2 text-sm font-semibold">Cancel</button>
                </form>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10">
                  <Trash2 className="h-4 w-4" /> Delete form
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  );
}

// ─── Option input list (for select/radio cards) ───────────────────────────────
type Opt = { id: string; label: string; value: string };
function OptionList({ type, options, onChange }: {
  type: FieldType; options: Opt[]; onChange: (opts: Opt[]) => void;
}) {
  const icon = type === "radio" ? "○" : type === "checkbox" ? "□" : "☰";

  function update(id: string, label: string) {
    const value = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || id;
    onChange(options.map(o => o.id === id ? { ...o, label, value } : o));
  }

  function add() {
    const n = options.length + 1;
    const id = `opt-${Date.now()}`;
    onChange([...options, { id, label: `Option ${n}`, value: `option_${n}` }]);
  }

  function remove(id: string) {
    onChange(options.filter(o => o.id !== id));
  }

  return (
    <div className="mt-4 space-y-2">
      {options.map(o => (
        <div key={o.id} className="flex items-center gap-3 group">
          <span className="w-4 shrink-0 text-center text-[var(--admin-muted)]">{icon}</span>
          <input value={o.label} onChange={e => update(o.id, e.target.value)}
            className="flex-1 border-b border-transparent bg-transparent py-1 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)] group-hover:border-[var(--admin-border)]" />
          <button type="button" onClick={() => remove(o.id)} className="opacity-0 group-hover:opacity-100 text-[var(--admin-muted)] hover:text-rose-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-3 text-sm text-[var(--admin-muted)] hover:text-sky-400">
        <span className="w-4 text-center">{icon}</span>
        <span>Add option</span>
      </button>
    </div>
  );
}

// ─── Field Preview (non-choice types) ────────────────────────────────────────
function FieldPreview({ type }: { type: FieldType }) {
  if (type === "text" || type === "email" || type === "tel" || type === "number" || type === "date" || type === "time") {
    return <div className="mt-4 border-b border-[var(--admin-border)] pb-1"><span className="text-sm text-[var(--admin-muted)]">{TYPE_LABELS[type]} answer</span></div>;
  }
  if (type === "textarea") {
    return <div className="mt-4 border-b border-[var(--admin-border)] pb-4"><span className="text-sm text-[var(--admin-muted)]">Long answer text</span></div>;
  }
  if (type === "file") {
    return (
      <div className="mt-4 flex items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <span className="text-sm text-[var(--admin-muted)] text-center font-medium">Click to upload file</span>
      </div>
    );
  }

  return null;
}

// ─── Google-style Field Card ──────────────────────────────────────────────────
function FieldCard({ field, onChange, onDelete }: {
  field: FieldDefinition;
  onChange: (field: FieldDefinition) => void;
  onDelete: () => void;
}) {
  const { label, type, scope, required, options } = field;
  const isChoiceType = type === "select" || type === "radio" || type === "checkbox";

  const update = (updates: Partial<FieldDefinition>) => {
    onChange({ ...field, ...updates });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] transition-all">

      {/* Drag handle */}
      <div className="flex cursor-grab justify-center py-2 opacity-30 transition-opacity hover:opacity-100 active:cursor-grabbing">
        <GripHorizontal className="h-4 w-4 text-[var(--admin-muted)]" />
      </div>

      {/* Question row */}
      <div className="flex items-start gap-4 px-6 pb-4">
        <input value={label} onChange={e => {
            const newLabel = e.target.value;
            const newKey = newLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "field";
            update({ label: newLabel, key: newKey });
          }}
          className="flex-1 border-b border-[var(--admin-border)] bg-transparent pb-2 text-base font-medium text-[var(--admin-text)] outline-none focus:border-sky-400"
          placeholder="Untitled question" />

        {/* Type selector */}
        <div className="relative shrink-0">
          <select value={type} onChange={e => update({ type: e.target.value as FieldType })}
            className="h-10 appearance-none rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] pl-3 pr-8 text-sm text-[var(--admin-text)] outline-none focus:border-sky-400">
            {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-[var(--admin-muted)]" />
        </div>
      </div>

      {/* Body: options or preview */}
      <div className="px-6 pb-4">
        {isChoiceType
          ? <OptionList type={type} options={(options || []).map((o, i) => ({ id: `o${i}`, ...o }))} onChange={(o) => update({ options: o.map((opt) => ({ label: opt.label, value: opt.value })) })} />
          : <FieldPreview type={type} />
        }
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--admin-border)] px-6 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--admin-muted)]">
            <span>Repeat per member</span>
            <button type="button" onClick={() => update({ scope: scope === "member" ? "submission" : "member" })}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${scope === "member" ? "bg-sky-500" : "bg-[var(--admin-border)]"}`}>
              <span className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${scope === "member" ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </label>

          <div className="ml-auto flex items-center gap-4">
            <button type="button" onClick={onDelete} className="text-[var(--admin-muted)] hover:text-rose-400">
              <Trash2 className="h-4 w-4" />
            </button>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[var(--admin-muted)]">
              Required
              <button type="button" onClick={() => update({ required: !required })}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${required ? "bg-sky-500" : "bg-[var(--admin-border)]"}`}>
                <span className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${required ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Field Builder ────────────────────────────────────────────────────────────
function FieldBuilder({ form }: { form: FormWithFields }) {
  const [fields, setFields] = useState<FieldDefinition[]>(
    [...form.fields].sort((a, b) =>
      a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.label.localeCompare(b.label)
    )
  );
  const [fieldsVersion, setFieldsVersion] = useState(form.fields);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error", message: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (form.fields !== fieldsVersion) {
    setFieldsVersion(form.fields);
    setFields(
      [...form.fields].sort((a, b) =>
        a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.label.localeCompare(b.label)
      )
    );
    setIsDirty(false);
  }

  useEffect(() => {
    if (toastMsg) {
      const timeout = setTimeout(() => setToastMsg(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [toastMsg]);

  function addQuestion() {
    setFields((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}`,
        formId: form.id,
        sortOrder: prev.length,
        label: "Untitled question",
        key: `untitled_question_${Date.now()}`,
        type: "text",
        scope: "submission",
        required: false,
        placeholder: "",
        helpText: "",
        options: [{ id: "o0", label: "Option 1", value: "option_1" }],
        validation: {},
      }
    ]);
    setIsDirty(true);
  }

  function handleReorder(newOrder: FieldDefinition[]) {
    // Sync the local order internally first
    setFields(newOrder.map((f, i) => ({ ...f, sortOrder: i })));
    setIsDirty(true);
  }

  async function handleBulkSave() {
    setIsSaving(true);
    setToastMsg(null);
    try {
      const payload = fields.map((f, i) => ({ ...f, sortOrder: i }));
      const res = await bulkSaveRegistrationFieldsAction(form.id, payload);
      if (res.status === "error") {
        setToastMsg({ type: "error", message: res.message || "Failed to save." });
      } else {
        setToastMsg({ type: "success", message: "Form fields saved successfully." });
      }
    } catch (e) {
      setToastMsg({ type: "error", message: (e as Error).message || "Failed to save." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {toastMsg && (
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${toastMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {toastMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          {toastMsg.message}
        </div>
      )}

      {isMounted && (
        <Reorder.Group axis="y" values={fields} onReorder={handleReorder} className="space-y-3">
          {fields.map((field) => (
            <Reorder.Item key={field.id} value={field}>
              <FieldCard 
                field={field} 
                onChange={(updated) => { setFields(fs => fs.map(f => f.id === field.id ? updated : f)); setIsDirty(true); }}
                onDelete={() => { setFields(fs => fs.filter(f => f.id !== field.id)); setIsDirty(true); }}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {isMounted && fields.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--admin-border)] py-12 text-center">
          <p className="text-sm text-[var(--admin-muted)]">
            No questions yet — click below to add your first
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={addQuestion}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--admin-border)] py-4 text-sm font-medium text-[var(--admin-muted)] transition hover:border-sky-500/50 hover:text-sky-400"
      >
        <Plus className="h-4 w-4" /> Add question
      </button>

      {/* Global Save Button */}
      {isMounted && isDirty && (
        <div className="sticky bottom-6 z-20 mt-8 flex items-center justify-between rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-2xl">
          <p className="pl-2 text-sm text-[var(--admin-muted)]">You have unsaved changes in your fields.</p>
          <button
            type="button"
            onClick={handleBulkSave}
            disabled={isSaving}
            className="theme-button flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold shadow-xl shadow-[var(--admin-accent)]/20 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Form Fields"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminRegistrationsManager({ forms, selectedForm, bannerUrl }: {
  forms: FormDefinition[];
  selectedForm: FormWithFields | null;
  bannerUrl: string | null;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const canCreate = forms.length < MAX_REGISTRATION_FORMS;

  if (showCreate || (forms.length === 0 && !selectedForm)) {
    return <CreateFormPanel formCount={forms.length} onCancel={() => setShowCreate(false)} />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Form tabs */}
      <FormTabsBar
        forms={forms} selectedId={selectedForm?.id}
        canCreate={canCreate} onNew={() => setShowCreate(true)}
      />

      {selectedForm ? (
        <div className="mt-4 space-y-0 overflow-hidden rounded-3xl border border-[var(--admin-border)]">
          {/* Purple accent bar like Google Forms */}
          <div className={`h-2 w-full ${selectedForm.kind === "competition" ? "bg-gradient-to-r from-sky-500 to-cyan-400" : "bg-gradient-to-r from-violet-500 to-purple-400"}`} />

          {/* Banner */}
          <BannerArea form={selectedForm} bannerUrl={bannerUrl} />

          {/* Form title & kind */}
          <div className="bg-[var(--admin-surface)] px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--admin-text)]">
                  {selectedForm.title}
                </h2>
                <div className="mt-1 flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] ${selectedForm.kind === "competition" ? "bg-sky-500/20 text-sky-300" : "bg-violet-500/20 text-violet-300"}`}>
                    {selectedForm.kind}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] ${selectedForm.status === "open" ? "bg-emerald-500/15 text-emerald-300" : selectedForm.status === "draft" ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/15 text-rose-300"}`}>
                    {selectedForm.status}
                  </span>
                  <span className="text-xs text-[var(--admin-muted)]">/{selectedForm.slug}</span>
                  <a href={`/${selectedForm.slug}`} target="_blank" className="text-sky-400 hover:text-sky-300">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <Link href={`/admin/registrations?form=${selectedForm.slug}`}
                className="admin-button-secondary rounded-2xl px-4 py-2 text-sm font-semibold">
                View responses
              </Link>
            </div>
          </div>

          {/* Settings */}
          <SettingsPanel form={selectedForm} />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[var(--admin-border)] p-8 text-center">
          <p className="text-sm text-[var(--admin-muted)]">Select a form above to edit it.</p>
        </div>
      )}

      {/* Questions */}
      {selectedForm && <FieldBuilder form={selectedForm} />}
    </div>
  );
}
