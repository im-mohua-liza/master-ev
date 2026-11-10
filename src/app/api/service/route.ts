import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { getNextCode } from "@/lib/codes";
import { round2 } from "@/lib/money";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  vehicleId: z.string().min(1, "Select a vehicle"),
  customerId: z.string().trim().optional(),
  serviceDate: z.string().optional(),
  odometer: z.coerce.number().int().nonnegative().optional(),
  serviceType: z.string().trim().optional(),
  issue: z.string().trim().optional(),
  partsUsed: z.string().trim().optional(),
  labourCharge: z.coerce.number().nonnegative().default(0),
  partsCost: z.coerce.number().nonnegative().default(0),
  technicianId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession(["OWNER", "MANAGER"]);
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const records = await prisma.serviceRecord.findMany({
      where: q
        ? {
            OR: [
              { serviceCode: { contains: q } },
              { vehicle: { vehicleCode: { contains: q } } },
              { vehicle: { chassisNumber: { contains: q } } },
              { customer: { name: { contains: q } } },
            ],
          }
        : undefined,
      include: { vehicle: { include: { model: true } }, customer: true, technician: true },
      orderBy: { serviceDate: "desc" },
    });

    return NextResponse.json({ records });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "ACCOUNTANT"]);
    const body = schema.parse(await req.json());
    const totalCost = round2(body.labourCharge + body.partsCost);

    const record = await prisma.$transaction(async (tx) => {
      const serviceCode = await getNextCode("SERVICE", tx);
      return tx.serviceRecord.create({
        data: {
          ...body,
          serviceCode,
          totalCost,
          customerId: body.customerId || undefined,
          technicianId: body.technicianId || undefined,
          serviceDate: body.serviceDate ? new Date(body.serviceDate) : undefined,
        },
      });
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "ServiceRecord",
      entityId: record.id,
      description: `Service record ${record.serviceCode} added`,
    });

    return NextResponse.json({ record });
  } catch (err) {
    return handleApiError(err);
  }
}
