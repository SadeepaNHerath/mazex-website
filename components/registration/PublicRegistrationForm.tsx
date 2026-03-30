"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type {
  FieldDefinition,
  FieldOption,
  FormAvailability,
  FormWithFields,
} from "@/lib/registration-types";
import {
  submitRegistrationAction,
  type SubmitRegistrationState,
} from "@/app/[slug]/actions";

const initialState: SubmitRegistrationState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  toastKey: 0,
};

function fieldInputClass(hasError: boolean) {
  return `w-full rounded-2xl border bg-[#0f172a]/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 ${
    hasError
      ? "border-rose-400/60 focus:border-rose-300"
      : "border-slate-700/70 focus:border-sky-400"
  }`;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="theme-button theme-button-register inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Submitting…" : "Submit registration"}
    </button>
  );
}

function FieldHint({ helpText, error }: { helpText: string | null; error?: string }) {
  if (!helpText && !error) return null;
  return (
    <div className="mt-2 space-y-1">
      {helpText && <p className="text-xs leading-5 text-slate-400">{helpText}</p>}
      {error && <p className="text-xs leading-5 text-rose-300">{error}</p>}
    </div>
  );
}

function ChoiceField({
  field,
  options,
  name,
  error,
}: {
  field: FieldDefinition;
  options: FieldOption[];
  name: string;
  error?: string;
}) {
  if (field.type === "select") {
    return (
      <>
        <select name={name} id={name} className={fieldInputClass(Boolean(error))}>
          <option value="">Select an option</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <FieldHint helpText={field.helpText} error={error} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/35 p-4">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-3 text-sm text-slate-200"
          >
            <input
              type={field.type === "radio" ? "radio" : "checkbox"}
              name={name}
              value={o.value}
              className={`h-4 w-4 border-slate-600 bg-slate-900 text-sky-400 ${field.type === "checkbox" ? "rounded" : ""}`}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <FieldHint helpText={field.helpText} error={error} />
    </>
  );
}

function RenderField({
  field,
  name,
  error,
}: {
  field: FieldDefinition;
  name: string;
  error?: string;
}) {
  const label = (
    <label
      htmlFor={field.type === "radio" ? undefined : name}
      className="block text-sm font-medium text-slate-100"
    >
      {field.label}
      {field.required ? (
        <span className="ml-1 text-rose-300">*</span>
      ) : (
        <span className="ml-2 text-xs font-normal text-slate-500">Optional</span>
      )}
    </label>
  );

  if (field.type === "select" || field.type === "radio" || field.type === "checkbox") {
    return (
      <div className="space-y-3">
        {label}
        <ChoiceField field={field} name={name} options={field.options} error={error} />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-3">
        {label}
        <textarea
          id={name}
          name={name}
          rows={4}
          placeholder={field.placeholder ?? ""}
          className={fieldInputClass(Boolean(error))}
        />
        <FieldHint helpText={field.helpText} error={error} />
      </div>
    );
  }

  if (field.type === "file") {
    return (
      <div className="space-y-3">
        {label}
        <input
          id={name}
          name={name}
          type="file"
          className="block w-full text-sm text-[var(--admin-muted)]
            file:mr-4 file:rounded-xl file:border-0
            file:bg-[var(--admin-accent)] file:px-4 file:py-2
            file:text-sm file:font-semibold file:text-white
            hover:file:bg-[var(--admin-accent)]/80 focus:outline-none file:cursor-pointer"
        />
        <FieldHint helpText={field.helpText} error={error} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label}
      <input
        id={name}
        name={name}
        type={field.type}
        placeholder={field.placeholder ?? ""}
        className={fieldInputClass(Boolean(error))}
      />
      <FieldHint helpText={field.helpText} error={error} />
    </div>
  );
}

export default function PublicRegistrationForm({
  form,
  availability,
  slug,
}: {
  form: FormWithFields;
  availability: FormAvailability;
  slug: string;
}) {
  const [state, setState] = useState(initialState);
  const [memberCount, setMemberCount] = useState(form.teamMinMembers);

  const formAction = async (formData: FormData) => {
    const result = await submitRegistrationAction(state, formData);
    setState(result);
  };

  const submissionFields = useMemo(
    () => form.fields.filter((f) => f.scope === "submission"),
    [form.fields],
  );
  const memberFields = useMemo(
    () => form.fields.filter((f) => f.scope === "member"),
    [form.fields],
  );
  const memberIndexes = useMemo(
    () => Array.from({ length: memberCount }, (_, i) => i),
    [memberCount],
  );

  if (state.status === "success") {
    return (
      <div className="admin-panel mx-auto w-full max-w-3xl p-8 sm:p-10">
        <div className="theme-chip w-fit text-[11px] font-bold uppercase tracking-[0.28em]">
          Submitted
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-50">
          Registration received
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{state.message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/#register"
            className="theme-button theme-button-register inline-flex rounded-full px-6 py-3 text-sm font-semibold"
          >
            Back to registrations
          </Link>
          <Link
            href="/"
            className="admin-button-secondary inline-flex rounded-full px-6 py-3 text-sm font-semibold"
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel p-6 sm:p-8">
      <form action={formAction} className="space-y-8">
        <input type="hidden" name="slug" value={slug} />

        {state.status === "error" && state.message && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {state.message}
          </div>
        )}

        {submissionFields.length === 0 && !availability.isAcceptingSubmissions ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-6 text-center">
            <p className="font-semibold text-amber-200">{availability.label}</p>
            {availability.description && (
              <p className="mt-1 text-sm text-amber-300/80">{availability.description}</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {submissionFields.map((field) => {
                const name = `submission__${field.key}`;
                return (
                  <div
                    key={field.id}
                    className={field.type === "textarea" ? "md:col-span-2" : undefined}
                  >
                    <RenderField
                      field={field}
                      name={name}
                      error={state.fieldErrors[name]}
                    />
                  </div>
                );
              })}
            </div>

            {memberFields.length > 0 && (
              <div className="space-y-6 rounded-[1.6rem] border border-slate-800/80 bg-slate-950/45 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="theme-chip w-fit text-[11px] font-bold uppercase tracking-[0.28em]">
                      Team Members
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
                      Competition team details
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Add each team member. Team size: {form.teamMinMembers}–
                      {form.teamMaxMembers}.
                    </p>
                  </div>

                  <div className="w-full max-w-xs space-y-3">
                    <label
                      htmlFor="memberCount"
                      className="block text-sm font-medium text-slate-100"
                    >
                      Team size
                    </label>
                    <select
                      id="memberCount"
                      name="memberCount"
                      value={memberCount}
                      onChange={(e) => setMemberCount(Number(e.target.value))}
                      className={fieldInputClass(Boolean(state.fieldErrors.memberCount))}
                    >
                      {Array.from(
                        { length: form.teamMaxMembers - form.teamMinMembers + 1 },
                        (_, i) => form.teamMinMembers + i,
                      ).map((v) => (
                        <option key={v} value={v}>
                          {v} {v === 1 ? "member" : "members"}
                        </option>
                      ))}
                    </select>
                    {state.fieldErrors.memberCount && (
                      <p className="text-xs text-rose-300">
                        {state.fieldErrors.memberCount}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {memberIndexes.map((i) => (
                    <div
                      key={i}
                      className="rounded-[1.4rem] border border-slate-800/80 bg-slate-950/40 p-5"
                    >
                      <h4 className="text-lg font-semibold text-slate-100">
                        Member {i + 1}
                      </h4>
                      <div className="mt-5 grid gap-5 md:grid-cols-2">
                        {memberFields.map((field) => {
                          const name = `member__${i}__${field.key}`;
                          return (
                            <div
                              key={`${field.id}-${i}`}
                              className={
                                field.type === "textarea" ? "md:col-span-2" : undefined
                              }
                            >
                              <RenderField
                                field={field}
                                name={name}
                                error={state.fieldErrors[name]}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <SubmitButton disabled={!availability.isAcceptingSubmissions} />
              {!availability.isAcceptingSubmissions && (
                <p className="text-sm text-slate-400">
                  This form is currently {availability.label.toLowerCase()}.
                </p>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
