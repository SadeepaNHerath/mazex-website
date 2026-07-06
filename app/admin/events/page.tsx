import AdminEventsForm from "@/components/admin/AdminEventsForm";
import { getRegistrationFormById, listRegistrationForms } from "@/lib/registrations";
import { getResolvedSiteEvents } from "@/lib/site-events";

export default async function AdminEventsPage() {
  const [forms, siteEvents] = await Promise.all([
    listRegistrationForms({ skipSiteEventAutoSync: true }),
    getResolvedSiteEvents(),
  ]);
  const formsWithFields = await Promise.all(
    forms.map((form) => getRegistrationFormById(form.id)),
  );
  const fieldsByFormId = new Map(
    formsWithFields
      .filter((form): form is NonNullable<typeof form> => form !== null)
      .map((form) => [form.id, form.fields] as const),
  );

  return (
    <AdminEventsForm
      forms={forms.map((form) => ({
        id: form.id,
        title: form.title,
        slug: form.slug,
        status: form.status,
        kind: form.kind,
        emailFields: (fieldsByFormId.get(form.id) ?? [])
          .filter((field) => field.scope === "submission" && field.type === "email")
          .map((field) => ({
            id: field.id,
            label: field.label,
          })),
      }))}
      events={siteEvents.adminItems}
    />
  );
}
