import { getBusinessProfile } from "@/lib/business";
import { PageHeader } from "@/components/data-table-shell";
import { BusinessProfileForm } from "@/components/business-profile-form";

export default async function BusinessSettingsPage() {
  const profile = await getBusinessProfile();

  return (
    <div className="max-w-3xl">
      <PageHeader title="Business Profile" subtitle="These details appear on every invoice and report" />
      <div className="card p-6 lg:p-8">
        <BusinessProfileForm mode="settings" initial={profile} />
      </div>
    </div>
  );
}
