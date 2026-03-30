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
          <div className="mx-auto mt-8 max-w-xl rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              No registration forms yet.
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
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
  const pageSizeParam = readQuery(params.pageSize);
  const pageSize = pageSizeParam === "all" ? "all" : Number(pageSizeParam ?? "15");
  const searchField = readQuery(params.searchField) ?? "";
  const searchQuery = readQuery(params.searchQuery) ?? "";

  const [submissionPage] = await Promise.all([
    listRegistrationSubmissions({
      formId: selectedForm.id,
      from,
      to,
      page: Number.isInteger(page) && page > 0 ? page : 1,
      pageSize: pageSize === "all" ? "all" : (Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 15),
      searchField,
      searchQuery,
    })
  ]);

  let selectedSubmission = submissionId
    ? submissionPage.submissions.find(s => s.id === submissionId) || null
    : null;

  if (submissionId && !selectedSubmission) {
    selectedSubmission = await getRegistrationSubmissionById(submissionId);
  }

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
         pageSize={pageSize}
         searchField={searchField}
         searchQuery={searchQuery}
       />
    </AdminDashboardShell>
  );
}
