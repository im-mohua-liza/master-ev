import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { PageHeader, StatusBadge } from "@/components/data-table-shell";
import { Pencil } from "lucide-react";

function fmtDate(d: Date | null) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: { include: { vehicle: { include: { model: true } } }, orderBy: { createdAt: "desc" } },
      payments: { orderBy: { paymentDate: "desc" } },
      serviceRecords: { include: { vehicle: true }, orderBy: { serviceDate: "desc" } },
      leads: { orderBy: { createdAt: "desc" } },
      bookings: { include: { vehicle: { include: { model: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) notFound();

  const activeSales = customer.sales.filter((s) => s.status !== "CANCELLED");
  const totalPurchases = activeSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPaid = activeSales.reduce((sum, s) => sum + s.amountPaid + s.exchangeValue, 0);
  const totalDue = activeSales.reduce((sum, s) => sum + s.balanceAmount, 0);

  return (
    <div>
      <PageHeader title={customer.name} subtitle={`Customer ${customer.customerCode}`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <Link href={`/customers/${customer.id}/edit`} className="btn-ghost !px-2 !py-1"><Pencil size={14} /> Edit</Link>
          </div>
          <dl className="text-sm space-y-2">
            <div><dt className="text-slate-500">Phone</dt><dd className="text-slate-900">{customer.phone}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="text-slate-900">{customer.email ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Address</dt><dd className="text-slate-900">{customer.address ?? "—"}{customer.city ? `, ${customer.city}` : ""} {customer.pin ?? ""}</dd></div>
            <div><dt className="text-slate-500">Occupation</dt><dd className="text-slate-900">{customer.occupation ?? "—"}</dd></div>
            <div><dt className="text-slate-500">GSTIN</dt><dd className="text-slate-900">{customer.gstin ?? "—"}</dd></div>
            <div><dt className="text-slate-500">PAN</dt><dd className="text-slate-900">{customer.pan ?? "—"}</dd></div>
            {customer.notes && <div><dt className="text-slate-500">Notes</dt><dd className="text-slate-900 whitespace-pre-line">{customer.notes}</dd></div>}
          </dl>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4"><div className="text-xs text-slate-500">Total Purchases</div><div className="text-xl font-bold text-slate-900">{formatINR(totalPurchases)}</div></div>
            <div className="card p-4"><div className="text-xs text-slate-500">Total Paid</div><div className="text-xl font-bold text-emerald-700">{formatINR(totalPaid)}</div></div>
            <div className="card p-4"><div className="text-xs text-slate-500">Total Due</div><div className={`text-xl font-bold ${totalDue > 0 ? "text-red-600" : "text-slate-900"}`}>{formatINR(totalDue)}</div></div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Scooters Purchased</h2>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Invoice</th><th>Vehicle</th><th>Date</th><th>Amount</th><th>Payment</th></tr></thead>
                <tbody>
                  {customer.sales.map((s) => (
                    <tr key={s.id}>
                      <td><Link href={`/sales/${s.id}`} className="text-emerald-700 hover:underline">{s.invoiceNumber ?? s.saleNumber}</Link></td>
                      <td>{s.vehicle.model.brand} {s.vehicle.model.model}</td>
                      <td>{fmtDate(s.saleDate)}</td>
                      <td>{formatINR(s.grandTotal)}</td>
                      <td><StatusBadge status={s.paymentStatus} tone={s.paymentStatus === "PAID" ? "green" : s.paymentStatus === "PARTIAL" ? "yellow" : "red"} /></td>
                    </tr>
                  ))}
                  {customer.sales.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No purchases yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Payment History</h2>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
                <tbody>
                  {customer.payments.map((p) => (
                    <tr key={p.id}><td>{fmtDate(p.paymentDate)}</td><td>{formatINR(p.amount)}</td><td>{p.method.replaceAll("_", " ")}</td><td>{p.referenceNumber ?? "—"}</td></tr>
                  ))}
                  {customer.payments.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No payments recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Service History</h2>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Date</th><th>Vehicle</th><th>Service Type</th><th>Cost</th></tr></thead>
                <tbody>
                  {customer.serviceRecords.map((s) => (
                    <tr key={s.id}><td>{fmtDate(s.serviceDate)}</td><td>{s.vehicle.vehicleCode}</td><td>{s.serviceType ?? "—"}</td><td>{formatINR(s.totalCost)}</td></tr>
                  ))}
                  {customer.serviceRecords.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No service records.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
