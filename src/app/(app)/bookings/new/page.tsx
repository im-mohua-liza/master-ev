"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/data-table-shell";

interface CustomerOption { id: string; name: string; phone: string }
interface VehicleOption { id: string; vehicleCode: string; sellingPrice: number; model: { brand: string; model: string; variant: string | null } }

const PAYMENT_METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "OTHER"];

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [form, setForm] = useState({
    customerId: searchParams.get("customerId") ?? "",
    vehicleId: "",
    bookingAmount: "5000",
    bookingDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: "",
    paymentMethod: "CASH",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then((d) => setCustomers(d.customers ?? []));
    fetch("/api/vehicles?availableOnly=1").then((r) => r.json()).then((d) => setVehicles(d.vehicles ?? []));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create booking");
      setLoading(false);
      return;
    }
    router.push("/bookings");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Booking" subtitle="Reserve a scooter with a booking payment" />
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div>
          <label className="label">Customer</label>
          <select className="input" required value={form.customerId} onChange={(e) => set("customerId", e.target.value)}>
            <option value="">Select customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
          </select>
          {customers.length === 0 && <p className="text-xs text-amber-600 mt-1">No customers yet — add a customer first.</p>}
        </div>
        <div>
          <label className="label">Vehicle (optional — reserves this unit)</label>
          <select className="input" value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
            <option value="">Not decided yet</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleCode} — {v.model.brand} {v.model.model} {v.model.variant}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Booking Amount (₹)</label>
            <input type="number" min="0" className="input" required value={form.bookingAmount} onChange={(e) => set("bookingAmount", e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replaceAll("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Booking Date</label>
            <input type="date" className="input" value={form.bookingDate} onChange={(e) => set("bookingDate", e.target.value)} />
          </div>
          <div>
            <label className="label">Expected Delivery Date</label>
            <input type="date" className="input" value={form.expectedDeliveryDate} onChange={(e) => set("expectedDeliveryDate", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Create Booking"}</button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
