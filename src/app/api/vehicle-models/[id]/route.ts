import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
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
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const model = await prisma.vehicleModel.findUnique({
      where: { id },
      include: { vehicles: true },
    });
    if (!model) throw new ApiError(404, "Model not found");
    return NextResponse.json({ model });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const { id } = await params;
    const body = schema.parse(await req.json());

    const model = await prisma.vehicleModel.update({ where: { id }, data: body });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "UPDATE",
      entityType: "VehicleModel",
      entityId: model.id,
      description: `Scooter model "${model.brand} ${model.model}" updated`,
    });

    return NextResponse.json({ model });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER"]);
    const { id } = await params;

    const vehicleCount = await prisma.vehicle.count({ where: { modelId: id } });
    if (vehicleCount > 0) {
      const model = await prisma.vehicleModel.update({ where: { id }, data: { isActive: false } });
      await logAudit({
        userId: session.user.id,
        userName: session.user.name ?? "",
        action: "UPDATE",
        entityType: "VehicleModel",
        entityId: id,
        description: `Model "${model.brand} ${model.model}" archived (has ${vehicleCount} vehicles)`,
      });
      return NextResponse.json({ archived: true });
    }

    const model = await prisma.vehicleModel.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "VehicleModel",
      entityId: id,
      description: `Model "${model.brand} ${model.model}" deleted`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
