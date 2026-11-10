"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/file-upload";

interface ModelOption {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  batteryType: string | null;
  batteryCapacity: string | null;
  motorPower: string | null;
  range: string | null;
  topSpeed: string | null;
  exShowroomPrice: number | null;
  gstRate: number;
  defaultPurchasePrice: number | null;
  defaultSellingPrice: number | null;
}

interface SupplierOption {
  id: string;
  companyName: string;
}

export interface VehicleFormData {
  modelId: string;
  colour: string;
  batteryType: string;
  batteryCapacity: string;
  motorPower: string;
  range: string;
  topSpeed: string;
  exShowroomPrice: string;
  sellingPrice: string;
  purchasePrice: string;
  dealerPrice: string;
  gstRate: string;
  chassisNumber: string;
  motorNumber: string;
  batteryNumber: string;
  manufacturingDate: string;
  purchaseDate: string;
  supplierId: string;
  location: string;
  warrantyMonths: string;
  batteryWarrantyMonths: string;
  photoUrl: string;
  notes: string;
}

const EMPTY: VehicleFormData = {
  modelId: "",
  colour: "",
  batteryType: "",
  batteryCapacity: "",
  motorPower: "",
  range: "",
  topSpeed: "",
  exShowroomPrice: "",
  sellingPrice: "",
  purchasePrice: "",
  dealerPrice: "",
  gstRate: "5",
  chassisNumber: "",
  motorNumber: "",
  batteryNumber: "",
  manufacturingDate: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  supplierId: "",
  location: "Showroom",
  warrantyMonths: "12",
  batteryWarrantyMonths: "36",
  photoUrl: "",
  notes: "",
};

export function VehicleForm({
  initial,
  vehicleId,
}: {
  initial?: Partial<VehicleFormData>;
  vehicleId?: string;
}) {
  const router = useRouter();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [form, setForm] = useState<VehicleFormData>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/vehicle-models?activeOnly=1").then((r) => r.json()).then((d) => setModels(d.models ?? []));
    fetch("/api/suppliers?activeOnly=1").then((r) => r.json()).then((d) => setSuppliers(d.suppliers ?? []));
  }, []);

  function set<K extends keyof VehicleFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onModelChange(modelId: string) {
    const m = models.find((x) => x.id === modelId);
    if (!m) {
      set("modelId", modelId);
      return;
    }
    setForm((f) => ({
      ...f,
      modelId,
      batteryType: m.batteryType ?? f.batteryType,
      batteryCapacity: m.batteryCapacity ?? f.batteryCapacity,
      motorPower: m.motorPower ?? f.motorPower,
      range: m.range ?? f.range,
      topSpeed: m.topSpeed ?? f.topSpeed,
      exShowroomPrice: m.exShowroomPrice?.toString() ?? f.exShowroomPrice,
      gstRate: m.gstRate.toString(),
      purchasePrice: m.defaultPurchasePrice?.toString() ?? f.purchasePrice,
      sellingPrice: m.defaultSellingPrice?.toString() ?? f.sellingPrice,
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = vehicleId ? `/api/vehicles/${vehicleId}` : "/api/vehicles";
    const res = await fetch(url, {
      method: vehicleId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save vehicle");
      setLoading(false);
      return;
    }
    router.push(`/inventory/vehicles/${data.vehicle.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-6">
      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>}

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Model & Appearance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Scooter Model</label>
            <select className="input" required value={form.modelId} onChange={(e) => onModelChange(e.target.value)}>
              <option value="">Select model</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.brand} {m.model} {m.variant}</option>
              ))}
            </select>
            {models.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No models yet — add a Scooter Model first.</p>
            )}
          </div>
          <div>
            <label className="label">Colour</label>
            <input className="input" value={form.colour} onChange={(e) => set("colour", e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Photo</label>
          <FileUpload folder="vehicles" value={form.photoUrl} onChange={(url) => set("photoUrl", url ?? "")} label="Upload photo" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Technical Specifications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Battery Type</label>
            <input className="input" value={form.batteryType} onChange={(e) => set("batteryType", e.target.value)} />
          </div>
          <div>
            <label className="label">Battery Capacity</label>
            <input className="input" value={form.batteryCapacity} onChange={(e) => set("batteryCapacity", e.target.value)} />
          </div>
          <div>
            <label className="label">Motor Power</label>
            <input className="input" value={form.motorPower} onChange={(e) => set("motorPower", e.target.value)} />
          </div>
          <div>
            <label className="label">Top Speed</label>
            <input className="input" value={form.topSpeed} onChange={(e) => set("topSpeed", e.target.value)} />
          </div>
          <div>
            <label className="label">Range</label>
            <input className="input" value={form.range} onChange={(e) => set("range", e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Identification Numbers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Chassis / VIN Number</label>
            <input className="input" required value={form.chassisNumber} onChange={(e) => set("chassisNumber", e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="label">Motor Number</label>
            <input className="input" required value={form.motorNumber} onChange={(e) => set("motorNumber", e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="label">Battery Number</label>
            <input className="input" required value={form.batteryNumber} onChange={(e) => set("batteryNumber", e.target.value.toUpperCase())} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Ex-Showroom Price (₹)</label>
            <input type="number" min="0" className="input" value={form.exShowroomPrice} onChange={(e) => set("exShowroomPrice", e.target.value)} />
          </div>
          <div>
            <label className="label">Purchase Price (₹)</label>
            <input type="number" min="0" className="input" required value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} />
          </div>
          <div>
            <label className="label">Selling Price (₹, GST incl.)</label>
            <input type="number" min="0" className="input" required value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} />
          </div>
          <div>
            <label className="label">GST Rate (%)</label>
            <input type="number" min="0" max="28" step="0.1" className="input" required value={form.gstRate} onChange={(e) => set("gstRate", e.target.value)} />
          </div>
          <div>
            <label className="label">Dealer Price (₹)</label>
            <input type="number" min="0" className="input" value={form.dealerPrice} onChange={(e) => set("dealerPrice", e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Purchase & Warranty</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Supplier</label>
            <select className="input" value={form.supplierId} onChange={(e) => set("supplierId", e.target.value)}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Purchase Date</label>
            <input type="date" className="input" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
          </div>
          <div>
            <label className="label">Manufacturing Date</label>
            <input type="date" className="input" value={form.manufacturingDate} onChange={(e) => set("manufacturingDate", e.target.value)} />
          </div>
          <div>
            <label className="label">Current Location</label>
            <input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div>
            <label className="label">Vehicle Warranty (months)</label>
            <input type="number" min="0" className="input" value={form.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value)} />
          </div>
          <div>
            <label className="label">Battery Warranty (months)</label>
            <input type="number" min="0" className="input" value={form.batteryWarrantyMonths} onChange={(e) => set("batteryWarrantyMonths", e.target.value)} />
          </div>
        </div>
      </section>

      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving..." : "Save Vehicle"}</button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
