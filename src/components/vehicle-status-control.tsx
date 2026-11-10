"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["IN_STOCK", "RESERVED", "SOLD", "DELIVERED", "SERVICE", "DAMAGED", "RETURNED"];

export function VehicleStatusControl({ vehicleId, currentStatus }: { vehicleId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(newStatus: string) {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/vehicles/${vehicleId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update status");
      setLoading(false);
      return;
    }
    setStatus(newStatus);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <select className="input" value={status} disabled={loading} onChange={(e) => onChange(e.target.value)}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
        ))}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
