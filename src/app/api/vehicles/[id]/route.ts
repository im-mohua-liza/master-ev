import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

const VEHICLE_STATUSES = [
  "IN_STOCK", "RESERVED", "SOLD", "DELIVERED", "SERVICE", "DAMAGED", "RETURNED",
] as const;

const schema = z.object({
  modelId: z.string().min(1),
  colour: z.string().trim().optional(),
  batteryType: z.string().trim().optional(),
  batteryCapacity: z.string().trim().optional(),
  motorPower: z.string().trim().optional(),
  range: z.string().trim().optional(),
  topSpeed: z.string().trim().optional(),
  exShowroomPrice: z.coerce.number().nonnegative().optional(),
  sellingPrice: z.coerce.number().positive(),
  purchasePrice: z.coerce.number().positive(),
  dealerPrice: z.coerce.number().nonnegative().optional(),
  gstRate: z.coerce.number().min(0).max(28),
  chassisNumber: z.string().trim().min(3),
  motorNumber: z.string().trim().min(3),
  batteryNumber: z.string().trim().min(3),
  manufacturingDate: z.string().optional(),
  purchaseDate: z.string().optional(),
  supplierId: z.string().trim().optional(),
  location: z.string().trim().optional(),
  status: z.enum(VEHICLE_STATUSES).optional(),
  warrantyMonths: z.coerce.number().int().nonnegative().optional(),
  batteryWarrantyMonths: z.coerce.number().int().nonnegative().optional(),
  photoUrl: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        model: true,
        supplier: true,
        sales: { include: { customer: true }, orderBy: { createdAt: "desc" } },
        serviceRecords: { orderBy: { serviceDate: "desc" } },
      },
    });
    if (!vehicle) throw new ApiError(404, "Vehicle not found");
    return NextResponse.json({ vehicle });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const { id } = await params;
    const body = schema.parse(await req.json());

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Vehicle not found");

    if ((existing.status === "SOLD" || existing.status === "DELIVERED") && body.status && body.status !== existing.status) {
      const activeSale = await prisma.sale.findFirst({ where: { vehicleId: id, status: { not: "CANCELLED" } } });
      if (activeSale) {
        throw new ApiError(400, "This vehicle has an active sale. Cancel the sale first to change its status.");
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...body,
        manufacturingDate: body.manufacturingDate ? new Date(body.manufacturingDate) : undefined,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        supplierId: body.supplierId || null,
      },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "UPDATE",
      entityType: "Vehicle",
      entityId: vehicle.id,
      description: `Scooter ${vehicle.vehicleCode} updated`,
    });

    return NextResponse.json({ vehicle });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER"]);
    const { id } = await params;

    const saleCount = await prisma.sale.count({ where: { vehicleId: id } });
    if (saleCount > 0) {
      throw new ApiError(400, "This vehicle has sale history and cannot be deleted. Mark it Returned/Damaged instead.");
    }

    const vehicle = await prisma.vehicle.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "Vehicle",
      entityId: id,
      description: `Scooter ${vehicle.vehicleCode} removed from inventory`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
