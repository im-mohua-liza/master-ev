import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { PageHeader, StatusBadge } from "@/components/data-table-shell";
import { VehicleStatusControl } from "@/components/vehicle-status-control";
import { Pencil } from "lucide-react";

const STATUS_TONE: Record<string, "green" | "yellow" | "red" | "slate" | "blue"> = {
  IN_STOCK: "green", RESERVED: "blue", SOLD: "yellow", DELIVERED: "slate",
  SERVICE: "yellow", DAMAGED: "red", RETURNED: "red",
};

function fmtDate(d: Date | null) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      model: true,
      supplier: true,
      sales: { include: { customer: true }, orderBy: { createdAt: "desc" } },
      serviceRecords: { orderBy: { serviceDate: "desc" } },
    },
  });
  if (!vehicle) notFound();

  const activeSale = vehicle.sales.find((s) => s.status !== "CANCELLED");
  const profit = activeSale ? activeSale.taxableValue - vehicle.purchasePrice : null;

  return (
    <div>
      <PageHeader title={vehicle.vehicleCode} subtitle={`${vehicle.model.brand} ${vehicle.model.model} ${vehicle.model.variant ?? ""}`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-5">
            {vehicle.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vehicle.photoUrl} alt={vehicle.vehicleCode} className="w-full h-48 object-cover rounded-lg mb-4" />
            ) : (
              <div className="w-full h-48 bg-slate-100 rounded-lg mb-4 flex items-center justify-center text-slate-400 text-sm">
                No photo uploaded
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <StatusBadge status={vehicle.status} tone={STATUS_TONE[vehicle.status] ?? "slate"} />
              <Link href={`/inventory/vehicles/${vehicle.id}/edit`} className="btn-ghost !px-2 !py-1">
                <Pencil size={14} /> Edit
              </Link>
            </div>
            {vehicle.status === "IN_STOCK" && (
              <Link href={`/sales/new?vehicleId=${vehicle.id}`} className="btn-primary w-full mb-3">
                Sell This Vehicle
              </Link>
            )}
            <div className="mb-3">
              <label className="label">Change Status</label>
              <VehicleStatusControl vehicleId={vehicle.id} currentStatus={vehicle.status} />
            </div>
            <dl className="text-sm space-y-2">
              <div><dt className="text-slate-500">Colour</dt><dd className="text-slate-900">{vehicle.colour ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Chassis / VIN</dt><dd className="text-slate-900 font-mono">{vehicle.chassisNumber}</dd></div>
              <div><dt className="text-slate-500">Motor Number</dt><dd className="text-slate-900 font-mono">{vehicle.motorNumber}</dd></div>
              <div><dt className="text-slate-500">Battery Number</dt><dd className="text-slate-900 font-mono">{vehicle.batteryNumber}</dd></div>
              <div><dt className="text-slate-500">Battery</dt><dd className="text-slate-900">{vehicle.batteryType} {vehicle.batteryCapacity}</dd></div>
              <div><dt className="text-slate-500">Motor Power</dt><dd className="text-slate-900">{vehicle.motorPower ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Range / Top Speed</dt><dd className="text-slate-900">{vehicle.range ?? "—"} / {vehicle.topSpeed ?? "—"}</dd></div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Purchase Details</h2>
            <dl className="text-sm space-y-2">
              <div><dt className="text-slate-500">Supplier</dt><dd className="text-slate-900">{vehicle.supplier?.companyName ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Purchase Date</dt><dd className="text-slate-900">{fmtDate(vehicle.purchaseDate)}</dd></div>
              <div><dt className="text-slate-500">Manufacturing Date</dt><dd className="text-slate-900">{fmtDate(vehicle.manufacturingDate)}</dd></div>
              <div><dt className="text-slate-500">Purchase Price</dt><dd className="text-slate-900">{formatINR(vehicle.purchasePrice)}</dd></div>
              <div><dt className="text-slate-500">Selling Price (incl. GST)</dt><dd className="text-slate-900">{formatINR(vehicle.sellingPrice)}</dd></div>
              <div><dt className="text-slate-500">GST Rate</dt><dd className="text-slate-900">{vehicle.gstRate}%</dd></div>
              <div><dt className="text-slate-500">Vehicle Warranty</dt><dd className="text-slate-900">{vehicle.warrantyMonths} months</dd></div>
              <div><dt className="text-slate-500">Battery Warranty</dt><dd className="text-slate-900">{vehicle.batteryWarrantyMonths} months</dd></div>
              <div><dt className="text-slate-500">Location</dt><dd className="text-slate-900">{vehicle.location ?? "—"}</dd></div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeSale && (
            <div className="card p-5 bg-emerald-50/40 border-emerald-200">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Sale & Customer</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-slate-500">Customer</dt><dd className="text-slate-900"><Link href={`/customers/${activeSale.customerId}`} className="text-emerald-700 hover:underline">{activeSale.customer.name}</Link></dd></div>
                <div><dt className="text-slate-500">Sale Date</dt><dd className="text-slate-900">{fmtDate(activeSale.saleDate)}</dd></div>
                <div><dt className="text-slate-500">Invoice Number</dt><dd className="text-slate-900">{activeSale.invoiceNumber ?? "Not generated"}</dd></div>
                <div><dt className="text-slate-500">Payment Status</dt><dd><StatusBadge status={activeSale.paymentStatus} tone={activeSale.paymentStatus === "PAID" ? "green" : activeSale.paymentStatus === "PARTIAL" ? "yellow" : "red"} /></dd></div>
                <div><dt className="text-slate-500">Sale Price</dt><dd className="text-slate-900">{formatINR(activeSale.grandTotal)}</dd></div>
                <div><dt className="text-slate-500">Balance Due</dt><dd className="text-slate-900">{formatINR(activeSale.balanceAmount)}</dd></div>
                {profit !== null && (
                  <div><dt className="text-slate-500">Vehicle Profit (est.)</dt><dd className={profit >= 0 ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>{formatINR(profit)}</dd></div>
                )}
              </div>
              <Link href={`/sales/${activeSale.id}`} className="btn-secondary mt-4 inline-flex">View Invoice</Link>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Service History</h2>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Date</th><th>Service Type</th><th>Issue</th><th>Cost</th><th>Technician</th></tr></thead>
                <tbody>
                  {vehicle.serviceRecords.map((s) => (
                    <tr key={s.id}>
                      <td>{fmtDate(s.serviceDate)}</td>
                      <td>{s.serviceType ?? "—"}</td>
                      <td>{s.issue ?? "—"}</td>
                      <td>{formatINR(s.totalCost)}</td>
                      <td>{s.technicianId ?? "—"}</td>
                    </tr>
                  ))}
                  {vehicle.serviceRecords.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-slate-500 py-8">No service records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {vehicle.notes && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">Notes</h2>
              <p className="text-sm text-slate-700 whitespace-pre-line">{vehicle.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
