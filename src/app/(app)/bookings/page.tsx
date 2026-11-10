"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader, SearchBox, StatusBadge, EmptyState } from "@/components/data-table-shell";
import { formatINR } from "@/lib/money";

interface BookingRow {
  id: string;
  bookingCode: string;
  bookingAmount: number;
  bookingDate: string;
  expectedDeliveryDate: string | null;
  status: string;
  customer: { name: string; phone: string };
  vehicle: { vehicleCode: string; model: { brand: string; model: string } } | null;
}

const TONE: Record<string, "green" | "yellow" | "red" | "slate" | "blue"> = {
  BOOKED: "blue", CONFIRMED: "yellow", CANCELLED: "red", CONVERTED: "green",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/bookings?${params.toString()}`);
    const data = await res.json();
    setBookings(data.bookings ?? []);
    setLoading(false);
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Scooter reservations awaiting delivery" actionLabel="New Booking" actionHref="/bookings/new" />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search booking code, customer..." />
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="BOOKED">Booked</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="CONVERTED">Converted to Sale</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Booking Code</th><th>Customer</th><th>Vehicle</th><th>Amount</th><th>Booking Date</th><th>Expected Delivery</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="font-medium">{b.bookingCode}</td>
                <td>{b.customer.name}</td>
                <td>{b.vehicle ? `${b.vehicle.vehicleCode} — ${b.vehicle.model.brand} ${b.vehicle.model.model}` : "Not decided"}</td>
                <td>{formatINR(b.bookingAmount)}</td>
                <td>{new Date(b.bookingDate).toLocaleDateString("en-IN")}</td>
                <td>{b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate).toLocaleDateString("en-IN") : "—"}</td>
                <td><StatusBadge status={b.status} tone={TONE[b.status] ?? "slate"} /></td>
                <td className="space-x-3">
                  {(b.status === "BOOKED" || b.status === "CONFIRMED") && (
                    <>
                      <Link href={`/sales/new?bookingId=${b.id}`} className="text-emerald-700 hover:underline text-sm">Convert to Sale</Link>
                      <button
                        className="text-red-600 hover:underline text-sm"
                        onClick={async () => {
                          if (!confirm(`Cancel booking ${b.bookingCode}?`)) return;
                          await fetch(`/api/bookings/${b.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "CANCEL" }),
                          });
                          load();
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && bookings.length === 0 && <EmptyState message="No bookings yet." />}
      </div>
    </div>
  );
}
