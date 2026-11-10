"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface VehicleModelFormData {
  brand: string;
  model: string;
  variant: string;
  batteryType: string;
  batteryCapacity: string;
  motorPower: string;
  range: string;
  topSpeed: string;
  exShowroomPrice: string;
  gstRate: string;
  defaultPurchasePrice: string;
  defaultSellingPrice: string;
}

const EMPTY: VehicleModelFormData = {
  brand: "",
  model: "",
  variant: "",
  batteryType: "Lithium-ion",
  batteryCapacity: "",
  motorPower: "",
  range: "",
  topSpeed: "",
  exShowroomPrice: "",
  gstRate: "5",
  defaultPurchasePrice: "",
  defaultSellingPrice: "",
};

export function VehicleModelForm({
  initial,
  modelId,
}: {
  initial?: Partial<VehicleModelFormData>;
  modelId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<VehicleModelFormData>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof VehicleModelFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = modelId ? `/api/vehicle-models/${modelId}` : "/api/vehicle-models";
    const res = await fetch(url, {
      method: modelId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      setLoading(false);
      return;
    }
    router.push("/inventory/models");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Brand</label>
          <input className="input" required value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Ola Electric" />
        </div>
        <div>
          <label className="label">Model</label>
          <input className="input" required value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. S1 Pro" />
        </div>
        <div>
          <label className="label">Variant</label>
          <input className="input" value={form.variant} onChange={(e) => set("variant", e.target.value)} placeholder="e.g. Gen 2" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="label">Battery Type</label>
          <input className="input" value={form.batteryType} onChange={(e) => set("batteryType", e.target.value)} />
        </div>
        <div>
          <label className="label">Battery Capacity</label>
          <input className="input" value={form.batteryCapacity} onChange={(e) => set("batteryCapacity", e.target.value)} placeholder="e.g. 4 kWh" />
        </div>
        <div>
          <label className="label">Motor Power</label>
          <input className="input" value={form.motorPower} onChange={(e) => set("motorPower", e.target.value)} placeholder="e.g. 6 kW" />
        </div>
        <div>
          <label className="label">Top Speed</label>
          <input className="input" value={form.topSpeed} onChange={(e) => set("topSpeed", e.target.value)} placeholder="e.g. 90 km/h" />
        </div>
      </div>
      <div>
        <label className="label">Range</label>
        <input className="input" value={form.range} onChange={(e) => set("range", e.target.value)} placeholder="e.g. 181 km" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="label">Ex-Showroom Price (₹)</label>
          <input type="number" min="0" className="input" value={form.exShowroomPrice} onChange={(e) => set("exShowroomPrice", e.target.value)} />
        </div>
        <div>
          <label className="label">GST Rate (%)</label>
          <input type="number" min="0" max="28" step="0.1" className="input" required value={form.gstRate} onChange={(e) => set("gstRate", e.target.value)} />
        </div>
        <div>
          <label className="label">Default Purchase Price (₹)</label>
          <input type="number" min="0" className="input" value={form.defaultPurchasePrice} onChange={(e) => set("defaultPurchasePrice", e.target.value)} />
        </div>
        <div>
          <label className="label">Default Selling Price (₹)</label>
          <input type="number" min="0" className="input" value={form.defaultSellingPrice} onChange={(e) => set("defaultSellingPrice", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Model"}</button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
