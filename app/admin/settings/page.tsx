import AdminSettingsForm from "@/components/admin/AdminSettingsForm";
import {
  getSharedGoogleSheetsConnection,
  isGoogleSheetsOAuthConfigured,
} from "@/lib/google-sheets";

export default async function AdminSettingsPage() {
  const googleSheetsConnection = await getSharedGoogleSheetsConnection();

  return (
    <AdminSettingsForm
      googleSheetsConnection={googleSheetsConnection}
      googleSheetsOAuthConfigured={isGoogleSheetsOAuthConfigured()}
    />
  );
}
