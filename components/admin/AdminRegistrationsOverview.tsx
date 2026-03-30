import Link from "next/link";
import { ClipboardList, ExternalLink, LayoutTemplate } from "lucide-react";
import { getRegistrationOverview } from "@/lib/registrations";

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

export default async function AdminRegistrationsOverview() {
  const overview = await getRegistrationOverview();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="admin-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="theme-chip text-[11px] font-bold uppercase tracking-[0.28em]">
              Registration Analytics
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--admin-text)]">
              Dynamic registration overview
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--admin-subtle)]">
              Track submission volume across the five forms, open the form builder
              to manage schemas, and review registrations on a separate submissions
              page.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/form-builder"
              className="admin-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <LayoutTemplate className="h-4 w-4" />
              Open form builder
            </Link>
            <Link
              href="/admin/registrations"
              className="theme-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <ClipboardList className="h-4 w-4" />
              Open registrations
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total submissions" value={String(overview.totalSubmissions)} />
          <MetricCard
            label="Open forms"
            value={String(
              overview.forms.filter((item) => item.availability.isAcceptingSubmissions)
                .length,
            )}
          />
          <MetricCard
            label="Competition forms"
            value={String(
              overview.forms.filter((item) => item.form.kind === "competition").length,
            )}
          />
          <MetricCard
            label="Workshop forms"
            value={String(
              overview.forms.filter((item) => item.form.kind === "workshop").length,
            )}
          />
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="admin-panel p-6 sm:p-8">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
            Forms
          </h3>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {overview.forms.map((item) => (
              <Link
                key={item.form.id}
                href={`/admin/form-builder?form=${item.form.slug}`}
                className="admin-panel-subtle block rounded-[1.4rem] p-5 transition hover:border-[var(--admin-border-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-muted)]">
                      {item.form.kind}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--admin-text)]">
                      {item.form.title}
                    </p>
                  </div>
                  <ExternalLink className="h-4.5 w-4.5 text-[var(--admin-muted)]" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MetricInline
                    label="Status"
                    value={item.availability.label}
                  />
                  <MetricInline
                    label="Submissions"
                    value={String(item.submissionCount)}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-panel p-6 sm:p-8">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
            Recent submissions
          </h3>

          {overview.recentSubmissions.length > 0 ? (
            <div className="mt-6 space-y-4">
              {overview.recentSubmissions.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/admin/registrations?form=${submission.formSlug ?? ""}&submission=${submission.id}`}
                  className="admin-panel-subtle block rounded-[1.4rem] p-5 transition hover:border-[var(--admin-border-strong)]"
                >
                  <p className="text-sm font-semibold text-[var(--admin-text)]">
                    {submission.primaryName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    {submission.primaryEmail}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[var(--admin-muted)]">
                    {submission.formTitle ?? "Registration"}
                  </p>
                  <p className="mt-2 text-xs text-[var(--admin-muted)]">
                    {formatTimestamp(submission.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="admin-panel-subtle mt-6 rounded-[1.4rem] p-8 text-center">
              <p className="text-base font-medium text-[var(--admin-text)]">
                No submissions yet.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
                Once registrations start coming in, recent activity will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-panel-subtle rounded-[1.4rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--admin-muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--admin-text)]">
        {value}
      </p>
    </div>
  );
}

function MetricInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--admin-text)]">
        {value}
      </p>
    </div>
  );
}
