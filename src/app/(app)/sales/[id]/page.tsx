import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/money";
import { PageHeader, StatusBadge } from "@/components/data-table-shell";
import { CancelSaleButton } from "@/components/cancel-sale-button";
import { Download } from "lucide-react";

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: { include: { model: true } },
      salesperson: true,
      payments: { orderBy: { paymentDate: "desc" } },
      booking: true,
    },
  });
  if (!sale) notFound();

  const profit = sale.taxableValue - sale.vehicle.purchasePrice;

  return (
    <div>
      <PageHeader title={sale.invoiceNumber ?? sale.saleNumber} subtitle={`Sale ${sale.saleNumber} · ${fmtDate(sale.saleDate)}`} />

      <div className="flex flex-wrap gap-3 mb-6">
        <a href={`/api/sales/${sale.id}/invoice`} target="_blank" rel="noreferrer" className="btn-primary">
          <Download size={16} /> Download / Print Invoice PDF
        </a>
        {sale.status !== "CANCELLED" && sale.balanceAmount > 0 && (
          <Link href={`/payments/new?saleId=${sale.id}&customerId=${sale.customerId}`} className="btn-secondary">
            Record Payment
          </Link>
        )}
        {sale.status !== "CANCELLED" && <CancelSaleButton saleId={sale.id} />}
        {sale.status === "CANCELLED" && <StatusBadge status="Cancelled" tone="red" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Customer & Vehicle</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Customer</dt><dd><Link href={`/customers/${sale.customerId}`} className="text-emerald-700 hover:underline">{sale.customer.name}</Link></dd></div>
              <div><dt className="text-slate-500">Phone</dt><dd className="text-slate-900">{sale.customer.phone}</dd></div>
              <div><dt className="text-slate-500">Vehicle</dt><dd><Link href={`/inventory/vehicles/${sale.vehicleId}`} className="text-emerald-700 hover:underline">{sale.vehicle.vehicleCode}</Link> — {sale.vehicle.model.brand} {sale.vehicle.model.model}</dd></div>
              <div><dt className="text-slate-500">Chassis No.</dt><dd className="text-slate-900 font-mono">{sale.vehicle.chassisNumber}</dd></div>
              <div><dt className="text-slate-500">Sales Executive</dt><dd className="text-slate-900">{sale.salesperson?.name ?? "—"}</dd></div>
              {sale.booking && <div><dt className="text-slate-500">Booking</dt><dd className="text-slate-900">{sale.booking.bookingCode}</dd></div>}
            </div>
            {sale.notes && <p className="text-sm text-slate-600 mt-3 border-t border-slate-100 pt-3 whitespace-pre-line">{sale.notes}</p>}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Payment History</h2>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
                <tbody>
                  {sale.payments.map((p) => (
                    <tr key={p.id}><td>{fmtDate(p.paymentDate)}</td><td>{formatINR(p.amount)}</td><td>{p.method.replaceAll("_", " ")}</td><td>{p.referenceNumber ?? "—"}</td></tr>
                  ))}
                  {sale.payments.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No payments recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Bill Summary</h2>
            <Row label="Base Price" value={formatINR(sale.basePrice)} />
            <Row label="Discount" value={`- ${formatINR(sale.discount)}`} />
            <Row label="Taxable Value" value={formatINR(sale.taxableValue)} />
            {sale.igst > 0 ? (
              <Row label={`IGST (${sale.gstRate}%)`} value={formatINR(sale.igst)} />
            ) : (
              <>
                <Row label={`CGST (${(sale.gstRate / 2).toFixed(1)}%)`} value={formatINR(sale.cgst)} />
                <Row label={`SGST (${(sale.gstRate / 2).toFixed(1)}%)`} value={formatINR(sale.sgst)} />
              </>
            )}
            <div className="border-t border-slate-200 pt-2"><Row label="Grand Total" value={formatINR(sale.grandTotal)} bold /></div>
            {sale.exchangeValue > 0 && <Row label="Exchange Value" value={`- ${formatINR(sale.exchangeValue)}`} />}
            <Row label="Amount Paid" value={formatINR(sale.amountPaid)} />
            <div className="border-t border-slate-200 pt-2"><Row label="Balance Due" value={formatINR(sale.balanceAmount)} bold /></div>
            <div className="pt-1">
              <StatusBadge status={sale.paymentStatus} tone={sale.paymentStatus === "PAID" ? "green" : sale.paymentStatus === "PARTIAL" ? "yellow" : "red"} />
            </div>
            <div className="border-t border-slate-200 mt-3 pt-3">
              <Row label="Vehicle Profit (est.)" value={formatINR(profit)} bold />
              <p className="text-xs text-slate-400 mt-1">Taxable value − purchase price. Excludes accessories/other costs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
