"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/file-upload";

export interface BusinessProfileData {
  businessName: string;
  ownerName?: string | null;
  address?: string | null;
  state?: string | null;
  district?: string | null;
  pin?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  pan?: string | null;
  logoUrl?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIFSC?: string | null;
  bankName?: string | null;
  upiId?: string | null;
  invoicePrefix: string;
  invoiceFormat: string;
  financialYearStart: string;
  termsAndConditions?: string | null;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Puducherry", "Chandigarh",
];

export function BusinessProfileForm({
  initial,
  mode,
}: {
  initial: Partial<BusinessProfileData> | null;
  mode: "setup" | "settings";
}) {
  const router = useRouter();
  const [form, setForm] = useState<BusinessProfileData>({
    businessName: initial?.businessName ?? "Master.EV",
    ownerName: initial?.ownerName ?? "",
    address: initial?.address ?? "",
    state: initial?.state ?? "",
    district: initial?.district ?? "",
    pin: initial?.pin ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    gstin: initial?.gstin ?? "",
    pan: initial?.pan ?? "",
    logoUrl: initial?.logoUrl ?? "",
    bankAccountName: initial?.bankAccountName ?? "",
    bankAccountNumber: initial?.bankAccountNumber ?? "",
    bankIFSC: initial?.bankIFSC ?? "",
    bankName: initial?.bankName ?? "",
    upiId: initial?.upiId ?? "",
    invoicePrefix: initial?.invoicePrefix ?? "MEV",
    invoiceFormat: initial?.invoiceFormat ?? "{PREFIX}/{FY}/{SEQ}",
    financialYearStart: initial?.financialYearStart ?? "04-01",
    termsAndConditions: initial?.termsAndConditions ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof BusinessProfileData>(key: K, value: BusinessProfileData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, markSetupCompleted: mode === "setup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        setLoading(false);
        return;
      }
      if (mode === "setup") {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSaved(true);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Could not reach the server");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2">
          Business profile saved.
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Business Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Business Name</label>
            <input className="input" required value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </div>
          <div>
            <label className="label">Owner Name</label>
            <input className="input" value={form.ownerName ?? ""} onChange={(e) => set("ownerName", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Business Address</label>
            <input className="input" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label className="label">State</label>
            <select className="input" value={form.state ?? ""} onChange={(e) => set("state", e.target.value)}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">District</label>
            <input className="input" value={form.district ?? ""} onChange={(e) => set("district", e.target.value)} />
          </div>
          <div>
            <label className="label">PIN Code</label>
            <input className="input" maxLength={6} value={form.pin ?? ""} onChange={(e) => set("pin", e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="label">Business Logo</label>
            <FileUpload folder="logo" value={form.logoUrl} onChange={(url) => set("logoUrl", url ?? "")} label="Upload logo" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Tax Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">GSTIN</label>
            <input className="input uppercase" maxLength={15} value={form.gstin ?? ""} onChange={(e) => set("gstin", e.target.value.toUpperCase())} placeholder="Optional if not yet registered" />
          </div>
          <div>
            <label className="label">PAN</label>
            <input className="input uppercase" maxLength={10} value={form.pan ?? ""} onChange={(e) => set("pan", e.target.value.toUpperCase())} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Bank & UPI Details (shown on invoices)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Bank Name</label>
            <input className="input" value={form.bankName ?? ""} onChange={(e) => set("bankName", e.target.value)} />
          </div>
          <div>
            <label className="label">Account Holder Name</label>
            <input className="input" value={form.bankAccountName ?? ""} onChange={(e) => set("bankAccountName", e.target.value)} />
          </div>
          <div>
            <label className="label">Account Number</label>
            <input className="input" value={form.bankAccountNumber ?? ""} onChange={(e) => set("bankAccountNumber", e.target.value)} />
          </div>
          <div>
            <label className="label">IFSC Code</label>
            <input className="input uppercase" value={form.bankIFSC ?? ""} onChange={(e) => set("bankIFSC", e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="label">UPI ID</label>
            <input className="input" value={form.upiId ?? ""} onChange={(e) => set("upiId", e.target.value)} placeholder="business@upi" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Invoice & Financial Year Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Invoice Prefix</label>
            <input className="input" value={form.invoicePrefix} onChange={(e) => set("invoicePrefix", e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="label">Invoice Number Format</label>
            <input className="input" value={form.invoiceFormat} onChange={(e) => set("invoiceFormat", e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">Use {"{PREFIX}"}, {"{FY}"}, {"{SEQ}"}</p>
          </div>
          <div>
            <label className="label">Financial Year Starts</label>
            <select
              className="input"
              value={form.financialYearStart}
              onChange={(e) => set("financialYearStart", e.target.value)}
            >
              <option value="04-01">1 April (Indian FY)</option>
              <option value="01-01">1 January</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Invoice Terms & Conditions</h2>
        <textarea
          className="input"
          rows={3}
          value={form.termsAndConditions ?? ""}
          onChange={(e) => set("termsAndConditions", e.target.value)}
          placeholder="e.g. Goods once sold will not be taken back. Warranty as per manufacturer terms."
        />
      </section>

      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Saving..." : mode === "setup" ? "Save & Continue to Dashboard" : "Save Changes"}
      </button>
    </form>
  );
}
