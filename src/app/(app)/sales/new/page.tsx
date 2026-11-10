"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/data-table-shell";
import { calculateSale } from "@/lib/sale-calc";
import { formatINR } from "@/lib/money";

interface CustomerOption { id: string; name: string; phone: string }
interface VehicleOption {
  id: string; vehicleCode: string; sellingPrice: number; gstRate: number; status: string;
  model: { brand: string; model: string; variant: string | null };
}
interface UserOption { id: string; name: string; isActive: boolean }
interface BookingDetail {
  id: string; bookingCode: string; bookingAmount: number; customerId: string; vehicleId: string | null;
  customer: CustomerOption; vehicle: VehicleOption | null;
}

const PAYMENT_METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "FINANCE", "CHEQUE", "OTHER"];

export default function NewSalePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [booking, setBooking] = useState<BookingDetail | null>(null);

  const [customerId, setCustomerId] = useState(searchParams.get("customerId") ?? "");
  const [vehicleId, setVehicleId] = useState(searchParams.get("vehicleId") ?? "");
  const [discount, setDiscount] = useState("0");
  const [exchangeValue, setExchangeValue] = useState("0");
  const [exchangeDetails, setExchangeDetails] = useState("");
  const [gstType, setGstType] = useState<"INTRA" | "INTER">("INTRA");
  const [amountPaidNow, setAmountPaidNow] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [salespersonId, setSalespersonId] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then((d) => setCustomers(d.customers ?? []));
    fetch("/api/vehicles?status=IN_STOCK").then((r) => r.json()).then((d) => setVehicles(d.vehicles ?? []));
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers((d.users ?? []).filter((u: UserOption) => u.isActive)));
  }, []);

  useEffect(() => {
    if (!bookingId) return;
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.booking) {
          setBooking(d.booking);
          setCustomerId(d.booking.customerId);
          if (d.booking.vehicleId) setVehicleId(d.booking.vehicleId);
        }
      });
  }, [bookingId]);

  const selectedVehicle = useMemo(() => {
    if (booking?.vehicle && booking.vehicleId === vehicleId) return booking.vehicle;
    return vehicles.find((v) => v.id === vehicleId) ?? null;
  }, [vehicles, vehicleId, booking]);

  const carriedForward = booking?.bookingAmount ?? 0;

  const calc = useMemo(() => {
    if (!selectedVehicle) return null;
    return calculateSale({
      basePrice: selectedVehicle.sellingPrice,
      discount: Number(discount) || 0,
      exchangeValue: Number(exchangeValue) || 0,
      gstRate: selectedVehicle.gstRate,
      amountPaid: carriedForward + (Number(amountPaidNow) || 0),
      gstType,
    });
  }, [selectedVehicle, discount, exchangeValue, amountPaidNow, gstType, carriedForward]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerId || !vehicleId) {
      setError("Select a customer and a vehicle");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        vehicleId,
        bookingId: bookingId || undefined,
        discount,
        exchangeValue,
        exchangeDetails,
        gstType,
        amountPaidNow,
        paymentMethod,
        salespersonId: salespersonId || undefined,
        notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create sale");
      setLoading(false);
      return;
    }
    router.push(`/sales/${data.sale.id}`);
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="New Sale" subtitle="Sell a scooter and generate a GST invoice" />
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

          {booking && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-2">
              Converting booking <strong>{booking.bookingCode}</strong> — customer and vehicle locked from booking.
              Booking amount already paid: <strong>{formatINR(booking.bookingAmount)}</strong>
            </div>
          )}

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Customer & Vehicle</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Customer</label>
                <select className="input" required disabled={!!booking} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Select customer</option>
                  {(booking ? [booking.customer] : customers).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Vehicle</label>
                <select className="input" required disabled={!!booking?.vehicleId} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">Select vehicle</option>
                  {(booking?.vehicle ? [booking.vehicle] : vehicles).map((v) => (
                    <option key={v.id} value={v.id}>{v.vehicleCode} — {v.model.brand} {v.model.model} {v.model.variant} ({formatINR(v.sellingPrice)})</option>
                  ))}
                </select>
                {!booking && vehicles.length === 0 && <p className="text-xs text-amber-600 mt-1">No vehicles in stock. Add inventory first.</p>}
              </div>
              <div>
                <label className="label">Sales Executive</label>
                <select className="input" value={salespersonId} onChange={(e) => setSalespersonId(e.target.value)}>
                  <option value="">Me</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">GST Type</label>
                <select className="input" value={gstType} onChange={(e) => setGstType(e.target.value as "INTRA" | "INTER")}>
                  <option value="INTRA">Intra-state (CGST + SGST)</option>
                  <option value="INTER">Inter-state (IGST)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Pricing & Discount</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Discount (₹)</label>
                <input type="number" min="0" className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
              <div>
                <label className="label">Exchange Value (₹)</label>
                <input type="number" min="0" className="input" value={exchangeValue} onChange={(e) => setExchangeValue(e.target.value)} />
              </div>
              {Number(exchangeValue) > 0 && (
                <div className="sm:col-span-2">
                  <label className="label">Exchange Vehicle Details</label>
                  <input className="input" placeholder="e.g. Honda Activa 2019, Reg. No. MH12AB1234" value={exchangeDetails} onChange={(e) => setExchangeDetails(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Payment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Amount Paid Now (₹)</label>
                <input type="number" min="0" className="input" value={amountPaidNow} onChange={(e) => setAmountPaidNow(e.target.value)} />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replaceAll("_", " ")}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-20 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Bill Summary</h2>
            {calc ? (
              <dl className="text-sm space-y-2">
                <Row label="Base Price" value={formatINR(calc.basePrice)} />
                <Row label="Discount" value={`- ${formatINR(calc.discount)}`} />
                <Row label="Price After Discount" value={formatINR(calc.priceAfterDiscount)} />
                <Row label="Taxable Value" value={formatINR(calc.taxableValue)} />
                {gstType === "INTRA" ? (
                  <>
                    <Row label={`CGST (${(calc.gstRate / 2).toFixed(1)}%)`} value={formatINR(calc.cgst)} />
                    <Row label={`SGST (${(calc.gstRate / 2).toFixed(1)}%)`} value={formatINR(calc.sgst)} />
                  </>
                ) : (
                  <Row label={`IGST (${calc.gstRate}%)`} value={formatINR(calc.igst)} />
                )}
                <Row label="Total GST" value={formatINR(calc.totalGst)} />
                <div className="border-t border-slate-200 pt-2">
                  <Row label="Grand Total" value={formatINR(calc.grandTotal)} bold />
                </div>
                {calc.exchangeValue > 0 && <Row label="Exchange Value" value={`- ${formatINR(calc.exchangeValue)}`} />}
                <Row label="Amount Paid" value={formatINR(calc.amountPaid)} />
                <div className="border-t border-slate-200 pt-2">
                  <Row label="Balance Due" value={formatINR(calc.balanceAmount)} bold />
                </div>
                <div className="pt-1">
                  <span className={`badge ${calc.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : calc.paymentStatus === "PARTIAL" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {calc.paymentStatus}
                  </span>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">Select a vehicle to see the bill.</p>
            )}
            <button type="submit" disabled={loading || !calc} className="btn-primary w-full mt-4">
              {loading ? "Creating sale..." : "Confirm Sale & Generate Invoice"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
