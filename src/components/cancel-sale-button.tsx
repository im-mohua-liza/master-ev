"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onCancel() {
    const reason = prompt("Reason for cancelling this sale (required for the audit log):");
    if (reason === null) return;
    if (!confirm("This will cancel the sale and return the vehicle to stock. Continue?")) return;

    setLoading(true);
    const res = await fetch(`/api/sales/${saleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CANCEL", reason }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Could not cancel sale");
      return;
    }
    router.refresh();
  }

  return (
    <button onClick={onCancel} disabled={loading} className="btn-danger">
      {loading ? "Cancelling..." : "Cancel Sale"}
    </button>
  );
}
