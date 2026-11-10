import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, vehicle: { include: { model: true } }, sale: true },
    });
    if (!booking) throw new ApiError(404, "Booking not found");
    return NextResponse.json({ booking });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  action: z.enum(["CANCEL", "CONFIRM"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES"]);
    const { id } = await params;
    const { action } = patchSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new ApiError(404, "Booking not found");
    if (booking.status === "CONVERTED") throw new ApiError(400, "This booking has already been converted to a sale.");

    const updated = await prisma.$transaction(async (tx) => {
      if (action === "CANCEL") {
        if (booking.vehicleId) {
          await tx.vehicle.update({ where: { id: booking.vehicleId }, data: { status: "IN_STOCK" } });
        }
        return tx.booking.update({ where: { id }, data: { status: "CANCELLED" } });
      }
      return tx.booking.update({ where: { id }, data: { status: "CONFIRMED" } });
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: action === "CANCEL" ? "CANCEL" : "UPDATE",
      entityType: "Booking",
      entityId: id,
      description: `Booking ${updated.bookingCode} ${action === "CANCEL" ? "cancelled" : "confirmed"}`,
    });

    return NextResponse.json({ booking: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
