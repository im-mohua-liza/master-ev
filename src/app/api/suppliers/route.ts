import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { optionalGstinSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  companyName: z.string().trim().min(2),
  contactPerson: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional(),
  gstin: optionalGstinSchema,
  bankDetails: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession(["OWNER", "MANAGER"]);
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const activeOnly = req.nextUrl.searchParams.get("activeOnly") === "1";

    const suppliers = await prisma.supplier.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(q
          ? {
              OR: [
                { companyName: { contains: q } },
                { contactPerson: { contains: q } },
                { phone: { contains: q } },
                { gstin: { contains: q } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { vehicles: true } } },
      orderBy: { companyName: "asc" },
    });

    return NextResponse.json({ suppliers });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const body = schema.parse(await req.json());

    const supplier = await prisma.supplier.create({
      data: { ...body, email: body.email || undefined },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "Supplier",
      entityId: supplier.id,
      description: `Supplier "${supplier.companyName}" added`,
    });

    return NextResponse.json({ supplier });
  } catch (err) {
    return handleApiError(err);
  }
}
