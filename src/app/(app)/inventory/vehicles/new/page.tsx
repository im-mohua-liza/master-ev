import { PageHeader } from "@/components/data-table-shell";
import { VehicleForm } from "@/components/vehicle-form";

export default function NewVehiclePage() {
  return (
    <div className="max-w-4xl">
      <PageHeader title="Add Vehicle" subtitle="Add a newly purchased scooter to inventory" />
      <VehicleForm />
    </div>
  );
}
