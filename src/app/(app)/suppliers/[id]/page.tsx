import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/data-table-shell";
import { Pencil } from "lucide-react";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { vehicles: { include: { model: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!supplier) notFound();

  const totalPurchases = supplier.vehicles.reduce((sum, v) => sum + v.purchasePrice, 0);
  const soldVehicles = supplier.vehicles.filter((v) => v.status !== "IN_STOCK" && v.status !== "RESERVED");

  return (
    <div>
      <PageHeader title={supplier.companyName} subtitle="Supplier profile & purchase history" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <Link href={`/suppliers/${supplier.id}/edit`} className="btn-ghost !px-2 !py-1">
              <Pencil size={14} /> Edit
            </Link>
          </div>
          <dl className="text-sm space-y-2">
            <div><dt className="text-slate-500">Contact Person</dt><dd className="text-slate-900">{supplier.contactPerson ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd className="text-slate-900">{supplier.phone ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="text-slate-900">{supplier.email ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Address</dt><dd className="text-slate-900">{supplier.address ?? "—"}</dd></div>
            <div><dt className="text-slate-500">GSTIN</dt><dd className="text-slate-900">{supplier.gstin ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Bank Details</dt><dd className="text-slate-900 whitespace-pre-line">{supplier.bankDetails ?? "—"}</dd></div>
          </dl>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="text-xs text-slate-500">Total Vehicles Supplied</div>
              <div className="text-xl font-bold text-slate-900">{supplier.vehicles.length}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-slate-500">Total Purchase Value</div>
              <div className="text-xl font-bold text-slate-900">{formatINR(totalPurchases)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-slate-500">Vehicles Sold</div>
              <div className="text-xl font-bold text-slate-900">{soldVehicles.length}</div>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Vehicles Supplied</h2>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Vehicle Code</th>
                    <th>Model</th>
                    <th>Chassis No.</th>
                    <th>Purchase Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.vehicles.map((v) => (
                    <tr key={v.id}>
                      <td><Link href={`/inventory/vehicles/${v.id}`} className="text-emerald-700 hover:underline">{v.vehicleCode}</Link></td>
                      <td>{v.model.brand} {v.model.model} {v.model.variant}</td>
                      <td>{v.chassisNumber}</td>
                      <td>{formatINR(v.purchasePrice)}</td>
                      <td>{v.status.replaceAll("_", " ")}</td>
                    </tr>
                  ))}
                  {supplier.vehicles.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-slate-500 py-8">No vehicles recorded from this supplier yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
