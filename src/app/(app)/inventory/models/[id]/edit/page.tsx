import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/data-table-shell";
import { VehicleModelForm } from "@/components/vehicle-model-form";

export default async function EditVehicleModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = await prisma.vehicleModel.findUnique({ where: { id } });
  if (!model) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader title={`Edit ${model.brand} ${model.model}`} />
      <VehicleModelForm
        modelId={model.id}
        initial={{
          brand: model.brand,
          model: model.model,
          variant: model.variant ?? "",
          batteryType: model.batteryType ?? "",
          batteryCapacity: model.batteryCapacity ?? "",
          motorPower: model.motorPower ?? "",
          range: model.range ?? "",
          topSpeed: model.topSpeed ?? "",
          exShowroomPrice: model.exShowroomPrice?.toString() ?? "",
          gstRate: model.gstRate.toString(),
          defaultPurchasePrice: model.defaultPurchasePrice?.toString() ?? "",
          defaultSellingPrice: model.defaultSellingPrice?.toString() ?? "",
        }}
      />
    </div>
  );
}
