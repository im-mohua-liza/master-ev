import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["IN_STOCK", "RESERVED", "SOLD", "DELIVERED", "SERVICE", "DAMAGED", "RETURNED"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const { id } = await params;
    const { status } = schema.parse(await req.json());

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Vehicle not found");

    if (["SOLD", "DELIVERED"].includes(existing.status) && !["SOLD", "DELIVERED", "SERVICE"].includes(status)) {
      const activeSale = await prisma.sale.findFirst({ where: { vehicleId: id, status: { not: "CANCELLED" } } });
      if (activeSale) throw new ApiError(400, "Cancel the active sale before changing this vehicle's status.");
    }

    const vehicle = await prisma.vehicle.update({ where: { id }, data: { status } });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "UPDATE",
      entityType: "Vehicle",
      entityId: id,
      description: `Scooter ${vehicle.vehicleCode} status changed to ${status}`,
    });

    return NextResponse.json({ vehicle });
  } catch (err) {
    return handleApiError(err);
  }
}
