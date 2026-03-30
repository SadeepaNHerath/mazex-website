import AdminDashboardShell from "@/components/admin/AdminDashboardShell";
import AdminRegistrationsManager from "@/components/admin/AdminRegistrationsManager";
import {
  getFormBannerUrl,
  getRegistrationFormBySlug,
  listRegistrationFormCards,
} from "@/lib/registrations";

type SearchParamsValue = string | string[] | undefined;

function readQuery(val: SearchParamsValue) {
  return Array.isArray(val) ? val[0] : val;
}

export default async function AdminFormBuilderPage({
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

  const bannerUrl =
    selectedForm?.bannerFileId ? getFormBannerUrl(selectedForm.bannerFileId) : null;

  return (
    <AdminDashboardShell>
      <AdminRegistrationsManager
        forms={forms}
        selectedForm={selectedForm}
        bannerUrl={bannerUrl}
      />
    </AdminDashboardShell>
  );
}
