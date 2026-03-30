import Link from "next/link";
import type {
  FormDefinition,
  FormWithFields,
  SubmissionDetail,
  SubmissionPage,
  SubmissionSummary,
} from "@/lib/registration-types";
import { getFieldLabelMap } from "@/lib/registrations";

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("en-LK", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Colombo",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildPageHref({
  slug,
  page,
  from,
  to,
  submissionId,
}: {
  slug: string;
  page?: number;
  from?: string | null;
  to?: string | null;
  submissionId?: string | null;
}) {
  const params = new URLSearchParams();

  params.set("form", slug);

  if (page && page > 1) {
    params.set("page", String(page));
  }

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  if (submissionId) {
    params.set("submission", submissionId);
  }

  return `/admin/registrations?${params.toString()}`;
}

function SubmissionDetailPanel({
  form,
  submission,
}: {
  form: FormWithFields;
  submission: SubmissionDetail;
}) {
  const labelMap = getFieldLabelMap(form.fields);

  return (
    <div className="admin-panel p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-muted)]">
            Submission Detail
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
            {submission.primaryName}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
            Submitted on {formatTimestamp(submission.createdAt)}
          </p>
        </div>

        <Link
          href={buildPageHref({ slug: form.slug })}
          className="admin-button-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold"
        >
          Clear detail view
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <SummaryItem label="Primary email" value={submission.primaryEmail} />
        {submission.primaryPhone && <SummaryItem label="Primary phone" value={submission.primaryPhone} />}
        {submission.teamName && <SummaryItem label="Team name" value={submission.teamName} />}
        <SummaryItem label="Form" value={submission.formTitle ?? form.title} />
      </div>

      <div className="mt-8 rounded-[1.4rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <h4 className="text-lg font-semibold text-[var(--admin-text)]">
          Submission fields
        </h4>
        <div className="mt-5 space-y-3">
          {Object.entries(submission.answers).map(([key, value]) => (
            <SummaryItem
              key={key}
              label={labelMap.get(key) ?? key}
              value={formatValue(value)}
            />
          ))}
        </div>
      </div>

      {submission.memberAnswers.length > 0 ? (
        <div className="mt-8 space-y-4">
          <h4 className="text-lg font-semibold text-[var(--admin-text)]">
            Team members
          </h4>
          {submission.memberAnswers.map((member, index) => (
            <div
              key={`${submission.id}-member-${index}`}
              className="rounded-[1.4rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
            >
              <p className="text-sm font-semibold text-[var(--admin-text)]">
                Member {index + 1}
              </p>
              <div className="mt-4 space-y-3">
                {Object.entries(member).map(([key, value]) => (
                  <SummaryItem
                    key={`${submission.id}-${index}-${key}`}
                    label={labelMap.get(key) ?? key}
                    value={formatValue(value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-4 py-3">
      <span className="text-sm text-[var(--admin-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--admin-text)]">
        {value}
      </span>
    </div>
  );
}

function SubmissionRow({
  form,
  submission,
  from,
  to,
}: {
  form: FormWithFields;
  submission: SubmissionSummary;
  from?: string | null;
  to?: string | null;
}) {
  return (
    <Link
      href={buildPageHref({
        slug: form.slug,
        from,
        to,
        submissionId: submission.id,
      })}
      className="admin-panel-subtle block rounded-[1.4rem] p-5 transition hover:border-[var(--admin-border-strong)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--admin-text)]">
            {submission.primaryName}
          </p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {submission.primaryEmail}
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--admin-muted)]">
          {formatTimestamp(submission.createdAt)}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {submission.primaryPhone && <SummaryItem label="Phone" value={submission.primaryPhone} />}
        {submission.teamName && <SummaryItem label="Team" value={submission.teamName} />}
      </div>
    </Link>
  );
}

export default function AdminRegistrationSubmissionsPanel({
  forms,
  form,
  submissionPage,
  selectedSubmission,
  from,
  to,
}: {
  forms: FormDefinition[];
  form: FormWithFields;
  submissionPage: SubmissionPage;
  selectedSubmission: SubmissionDetail | null;
  from?: string | null;
  to?: string | null;
}) {
  const totalPages = Math.max(1, Math.ceil(submissionPage.total / submissionPage.pageSize));
  const exportParams = new URLSearchParams();

  exportParams.set("form", form.slug);

  if (from) {
    exportParams.set("from", from);
  }

  if (to) {
    exportParams.set("to", to);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="admin-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="theme-chip text-[11px] font-bold uppercase tracking-[0.28em]">
              Registrations
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--admin-text)]">
              Submission inbox
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--admin-subtle)]">
              Review submissions for each of the five forms separately, inspect
              full responses, and export each form’s data when needed.
            </p>
          </div>

          <Link
            href={`/admin/form-builder?form=${form.slug}`}
            className="theme-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            Open form builder
          </Link>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-5">
          {forms.map((item) => (
            <Link
              key={item.id}
              href={buildPageHref({ slug: item.slug })}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                item.id === form.id
                  ? "border-sky-500/35 bg-sky-500/10 text-[var(--admin-text)]"
                  : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-text)]"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]">
                {item.kind}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6">{item.title}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-muted)]">
              Submissions
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
              {form.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
              Filter by date range, inspect individual submissions, and export the
              current form’s data as CSV.
            </p>
          </div>

          <a
            href={`/admin/registrations/export?${exportParams.toString()}`}
            className="theme-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            Export CSV
          </a>
        </div>

        <form className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="form" value={form.slug} />
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--admin-text)]">
              From date
            </label>
            <input
              type="date"
              name="from"
              defaultValue={from ?? ""}
              className="h-[52px] w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm text-[var(--admin-text)] outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--admin-text)]">
              To date
            </label>
            <input
              type="date"
              name="to"
              defaultValue={to ?? ""}
              className="h-[52px] w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm text-[var(--admin-text)] outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="theme-button inline-flex h-[52px] w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold md:w-auto"
            >
              Apply filters
            </button>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          {submissionPage.submissions.length > 0 ? (
            submissionPage.submissions.map((submission) => (
              <SubmissionRow
                key={submission.id}
                form={form}
                submission={submission}
                from={from}
                to={to}
              />
            ))
          ) : (
            <div className="admin-panel-subtle rounded-[1.4rem] p-8 text-center">
              <p className="text-base font-medium text-[var(--admin-text)]">
                No submissions found.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
                Once users submit this form, they will appear here.
              </p>
            </div>
          )}
        </div>

        {submissionPage.total > submissionPage.pageSize ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[var(--admin-muted)]">
              Page {submissionPage.page} of {totalPages}
            </p>

            <div className="flex items-center gap-3">
              <Link
                href={buildPageHref({
                  slug: form.slug,
                  page: Math.max(1, submissionPage.page - 1),
                  from,
                  to,
                })}
                className={`admin-button-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                  submissionPage.page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Previous
              </Link>
              <Link
                href={buildPageHref({
                  slug: form.slug,
                  page: Math.min(totalPages, submissionPage.page + 1),
                  from,
                  to,
                })}
                className={`admin-button-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                  submissionPage.page >= totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {selectedSubmission ? (
        <SubmissionDetailPanel form={form} submission={selectedSubmission} />
      ) : null}
    </div>
  );
}
