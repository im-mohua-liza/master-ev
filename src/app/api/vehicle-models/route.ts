import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1),
  variant: z.string().trim().optional(),
  batteryType: z.string().trim().optional(),
  batteryCapacity: z.string().trim().optional(),
  motorPower: z.string().trim().optional(),
  range: z.string().trim().optional(),
  topSpeed: z.string().trim().optional(),
  exShowroomPrice: z.coerce.number().nonnegative().optional(),
  gstRate: z.coerce.number().min(0).max(28),
  defaultPurchasePrice: z.coerce.number().nonnegative().optional(),
  defaultSellingPrice: z.coerce.number().nonnegative().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const activeOnly = req.nextUrl.searchParams.get("activeOnly") === "1";

    const models = await prisma.vehicleModel.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(q ? { OR: [{ brand: { contains: q } }, { model: { contains: q } }] } : {}),
      },
      include: { _count: { select: { vehicles: true } } },
      orderBy: [{ brand: "asc" }, { model: "asc" }],
    });

    return NextResponse.json({ models });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const body = schema.parse(await req.json());

    const model = await prisma.vehicleModel.create({ data: body });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "VehicleModel",
      entityId: model.id,
      description: `Scooter model "${model.brand} ${model.model} ${model.variant ?? ""}" added`,
    });

    return NextResponse.json({ model });
  } catch (err) {
    return handleApiError(err);
  }
}
