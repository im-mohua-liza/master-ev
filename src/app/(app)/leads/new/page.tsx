import { PageHeader } from "@/components/data-table-shell";
import { LeadForm } from "@/components/lead-form";

export default function NewLeadPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Lead" subtitle="Track a new potential customer" />
      <LeadForm />
    </div>
  );
}
