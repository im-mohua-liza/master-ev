import { PageHeader } from "@/components/data-table-shell";
import { VehicleModelForm } from "@/components/vehicle-model-form";

export default function NewVehicleModelPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Add Scooter Model" subtitle="Add a new EV scooter brand/model to your catalog" />
      <VehicleModelForm />
    </div>
  );
}
