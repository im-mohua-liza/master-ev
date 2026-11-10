import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { getNextCode } from "@/lib/codes";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  vehicleId: z.string().trim().optional(),
  bookingAmount: z.coerce.number().nonnegative(),
  bookingDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  paymentMethod: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status");
    const q = sp.get("q")?.trim();

    const bookings = await prisma.booking.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? { OR: [{ bookingCode: { contains: q } }, { customer: { name: { contains: q } } }] }
          : {}),
      },
      include: { customer: true, vehicle: { include: { model: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES"]);
    const body = schema.parse(await req.json());

    if (body.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
      if (!vehicle) throw new ApiError(404, "Vehicle not found");
      if (vehicle.status !== "IN_STOCK") {
        throw new ApiError(400, `This vehicle is currently ${vehicle.status.replaceAll("_", " ")} and cannot be booked.`);
      }
    }

    const booking = await prisma.$transaction(async (tx) => {
      const bookingCode = await getNextCode("BOOKING", tx);
      const created = await tx.booking.create({
        data: {
          customerId: body.customerId,
          vehicleId: body.vehicleId || undefined,
          bookingAmount: body.bookingAmount,
          bookingDate: body.bookingDate ? new Date(body.bookingDate) : undefined,
          expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : undefined,
          paymentMethod: body.paymentMethod,
          notes: body.notes,
          bookingCode,
        },
      });

      if (body.vehicleId) {
        await tx.vehicle.update({ where: { id: body.vehicleId }, data: { status: "RESERVED" } });
      }

      if (body.bookingAmount > 0) {
        const paymentCode = await getNextCode("PAYMENT", tx);
        await tx.payment.create({
          data: {
            paymentCode,
            customerId: body.customerId,
            amount: body.bookingAmount,
            method: body.paymentMethod || "CASH",
            notes: `Booking amount for ${bookingCode}`,
            recordedById: session.user.id,
          },
        });
      }

      return created;
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "Booking",
      entityId: booking.id,
      description: `Booking ${booking.bookingCode} created`,
    });

    return NextResponse.json({ booking });
  } catch (err) {
    return handleApiError(err);
  }
}
