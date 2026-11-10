"use client";

import { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

export function FileUpload({
  folder,
  value,
  onChange,
  accept = "image/*",
  label = "Upload file",
}: {
  folder: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {value && (
        <div className="mb-2">
          {accept.includes("image") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Uploaded file" className="h-20 w-20 rounded-lg object-cover border border-slate-200" />
          ) : (
            <a href={value} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">
              View uploaded file
            </a>
          )}
        </div>
      )}
      <label className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 cursor-pointer hover:bg-slate-50 w-fit">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
        {loading ? "Uploading..." : value ? "Replace " + label : label}
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
