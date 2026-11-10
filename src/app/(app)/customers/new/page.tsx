import { PageHeader } from "@/components/data-table-shell";
import { CustomerForm } from "@/components/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Customer" />
      <div className="card p-6">
        <CustomerForm />
      </div>
    </div>
  );
}
