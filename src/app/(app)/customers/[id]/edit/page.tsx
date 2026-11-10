import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/data-table-shell";
import { CustomerForm } from "@/components/customer-form";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${customer.name}`} />
      <div className="card p-6">
        <CustomerForm
          customerId={customer.id}
          initial={{
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? "",
            address: customer.address ?? "",
            city: customer.city ?? "",
            pin: customer.pin ?? "",
            gstin: customer.gstin ?? "",
            pan: customer.pan ?? "",
            idReference: customer.idReference ?? "",
            occupation: customer.occupation ?? "",
            notes: customer.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
