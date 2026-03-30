import AdminDashboardShell from "@/components/admin/AdminDashboardShell";
import AdminRegistrationSubmissionsPanel from "@/components/admin/AdminRegistrationSubmissionsPanel";
import {
  getRegistrationFormBySlug,
  getRegistrationSubmissionById,
  listRegistrationFormCards,
  listRegistrationForms,
  listRegistrationSubmissions,
} from "@/lib/registrations";

type SearchParamsValue = string | string[] | undefined;

function readQuery(val: SearchParamsValue) {
  return Array.isArray(val) ? val[0] : val;
}

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamsValue>>;
}) {
  const params = await searchParams;
  const formCards = await listRegistrationFormCards();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const forms = formCards.map(({ availability, ...form }) => form);

  const slugParam = readQuery(params.form) ?? forms[0]?.slug ?? "";
  const selectedForm = slugParam ? await getRegistrationFormBySlug(slugParam) : null;

  if (!selectedForm) {
    const fallbackForms = await listRegistrationForms();
    const fallbackForm = fallbackForms[0]
      ? await getRegistrationFormBySlug(fallbackForms[0].slug)
      : null;

    if (!fallbackForm) {
      return (
        <AdminDashboardShell>
          <div className="admin-panel p-8 text-center">
            <p className="text-base font-medium text-[var(--admin-text)]">
              No registration forms yet.
            </p>
            <p className="mt-2 text-sm text-[var(--admin-muted)]">
              Go to Form Builder to create your first form.
            </p>
          </div>
        </AdminDashboardShell>
      );
    }

    const submissionPage = await listRegistrationSubmissions({
      formId: fallbackForm.id,
      page: 1,
      pageSize: 15,
    });

    return (
      <AdminDashboardShell>
        <AdminRegistrationSubmissionsPanel
          forms={fallbackForms}
          form={fallbackForm}
          submissionPage={submissionPage}
          selectedSubmission={null}
        />
      </AdminDashboardShell>
    );
  }

  const from = readQuery(params.from) ?? "";
  const to = readQuery(params.to) ?? "";
  const page = Number(readQuery(params.page) ?? "1");
  const submissionId = readQuery(params.submission) ?? "";

  const [submissionPage, selectedSubmission] = await Promise.all([
    listRegistrationSubmissions({
      formId: selectedForm.id,
      from,
      to,
      page: Number.isInteger(page) && page > 0 ? page : 1,
      pageSize: 15,
    }),
    submissionId ? getRegistrationSubmissionById(submissionId) : Promise.resolve(null),
  ]);

  return (
    <AdminDashboardShell>
      <AdminRegistrationSubmissionsPanel
        forms={forms}
        form={selectedForm}
        submissionPage={submissionPage}
        selectedSubmission={
          selectedSubmission?.formId === selectedForm.id ? selectedSubmission : null
        }
        from={from}
        to={to}
      />
    </AdminDashboardShell>
  );
}
