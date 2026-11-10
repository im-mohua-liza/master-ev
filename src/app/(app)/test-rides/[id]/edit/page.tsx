import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/data-table-shell";
import { TestRideForm } from "@/components/test-ride-form";

export default async function EditTestRidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const testRide = await prisma.testRide.findUnique({ where: { id } });
  if (!testRide) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Test Ride: ${testRide.customerName}`} />
      <TestRideForm
        testRideId={testRide.id}
        initial={{
          customerName: testRide.customerName,
          phone: testRide.phone,
          modelId: testRide.modelId,
          vehicleNumber: testRide.vehicleNumber ?? "",
          scheduledDate: new Date(testRide.scheduledDate).toISOString().slice(0, 10),
          scheduledTime: testRide.scheduledTime ?? "",
          salespersonId: testRide.salespersonId ?? "",
          status: testRide.status,
          feedback: testRide.feedback ?? "",
        }}
      />
    </div>
  );
}
