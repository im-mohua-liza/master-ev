import { PageHeader } from "@/components/data-table-shell";
import { TestRideForm } from "@/components/test-ride-form";

export default function NewTestRidePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Schedule Test Ride" />
      <TestRideForm />
    </div>
  );
}
