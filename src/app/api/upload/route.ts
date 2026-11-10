import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireSession, handleApiError } from "@/lib/api-guard";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    await requireSession();

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
    }

    const folder = (formData.get("folder") as string | null) ?? "misc";
    const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");
    const ext = path.extname(file.name) || "";
    const filename = `${randomUUID()}${ext}`;

    // On Vercel (and other serverless hosts) the local filesystem is
    // ephemeral/read-only, so uploads are stored in Vercel Blob when
    // configured. Locally, or on a persistent-disk host (VPS/Railway/
    // Render), files are written straight to /public/uploads instead —
    // no extra service required. See DEPLOYMENT.md.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`${safeFolder}/${filename}`, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return NextResponse.json({ url: blob.url });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${safeFolder}/${filename}`;
    return NextResponse.json({ url });
  } catch (err) {
    return handleApiError(err);
  }
}
