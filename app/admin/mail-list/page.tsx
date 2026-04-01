import AdminContactsMailer from "@/components/admin/AdminContactsMailer";
import { listRegistrationEmailContacts } from "@/lib/messaging-contacts";

export default async function AdminContactsPage() {
  const contacts = await listRegistrationEmailContacts();

  return <AdminContactsMailer contacts={contacts} />;
}
