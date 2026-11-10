import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/data-table-shell";
import { VehicleForm } from "@/components/vehicle-form";

function toDateInput(d: Date | null) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader title={`Edit ${vehicle.vehicleCode}`} />
      <VehicleForm
        vehicleId={vehicle.id}
        initial={{
          modelId: vehicle.modelId,
          colour: vehicle.colour ?? "",
          batteryType: vehicle.batteryType ?? "",
          batteryCapacity: vehicle.batteryCapacity ?? "",
          motorPower: vehicle.motorPower ?? "",
          range: vehicle.range ?? "",
          topSpeed: vehicle.topSpeed ?? "",
          exShowroomPrice: vehicle.exShowroomPrice?.toString() ?? "",
          sellingPrice: vehicle.sellingPrice.toString(),
          purchasePrice: vehicle.purchasePrice.toString(),
          dealerPrice: vehicle.dealerPrice?.toString() ?? "",
          gstRate: vehicle.gstRate.toString(),
          chassisNumber: vehicle.chassisNumber,
          motorNumber: vehicle.motorNumber,
          batteryNumber: vehicle.batteryNumber,
          manufacturingDate: toDateInput(vehicle.manufacturingDate),
          purchaseDate: toDateInput(vehicle.purchaseDate),
          supplierId: vehicle.supplierId ?? "",
          location: vehicle.location ?? "",
          warrantyMonths: vehicle.warrantyMonths?.toString() ?? "",
          batteryWarrantyMonths: vehicle.batteryWarrantyMonths?.toString() ?? "",
          photoUrl: vehicle.photoUrl ?? "",
          notes: vehicle.notes ?? "",
        }}
      />
    </div>
  );
}
