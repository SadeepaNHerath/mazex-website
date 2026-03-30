import AdminDashboardShell from "@/components/admin/AdminDashboardShell";
import AdminRegistrationsOverview from "@/components/admin/AdminRegistrationsOverview";

export default async function AdminDashboardPage() {
  return (
    <AdminDashboardShell>
      <AdminRegistrationsOverview />
    </AdminDashboardShell>
  );
}
