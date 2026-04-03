import AdminSponsorsForm from "@/components/admin/AdminSponsorsForm";
import { listSponsors } from "@/lib/sponsors";
import { getSponsorOpeningsEnabled } from "@/lib/site-resources";

export default async function AdminSponsorsPage() {
  const [sponsors, sponsorOpeningsEnabled] = await Promise.all([
    listSponsors(),
    getSponsorOpeningsEnabled(),
  ]);

  return (
    <AdminSponsorsForm
      sponsors={sponsors}
      sponsorOpeningsEnabled={sponsorOpeningsEnabled}
    />
  );
}
