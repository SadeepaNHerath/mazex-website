import AdminDashboardShell from "@/components/admin/AdminDashboardShell";
import AdminResourcesForm from "@/components/admin/AdminResourcesForm";
import {
  DELEGATE_BOOKLET_RESOURCE_KEY,
  getSiteResourceValue,
} from "@/lib/site-resources";

export default async function AdminResourcesPage() {
  const delegateBooklet =
    (await getSiteResourceValue(DELEGATE_BOOKLET_RESOURCE_KEY)) ?? "";

  return (
    <AdminDashboardShell>
      <AdminResourcesForm delegateBooklet={delegateBooklet} />
    </AdminDashboardShell>
  );
}
