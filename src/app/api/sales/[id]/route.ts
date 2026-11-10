import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: { include: { model: true, supplier: true } },
        salesperson: true,
        payments: { orderBy: { paymentDate: "desc" } },
        booking: true,
      },
    });
    if (!sale) throw new ApiError(404, "Sale not found");
    return NextResponse.json({ sale });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  action: z.literal("CANCEL"),
  reason: z.string().trim().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const { id } = await params;
    const { reason } = patchSchema.parse(await req.json());

    const sale = await prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new ApiError(404, "Sale not found");
    if (sale.status === "CANCELLED") throw new ApiError(400, "This sale is already cancelled.");

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.sale.update({
        where: { id },
        data: {
          status: "CANCELLED",
          notes: [sale.notes, reason ? `Cancelled: ${reason}` : "Cancelled"].filter(Boolean).join(" | "),
        },
      });
      await tx.vehicle.update({ where: { id: sale.vehicleId }, data: { status: "IN_STOCK" } });
      return s;
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CANCEL",
      entityType: "Sale",
      entityId: id,
      description: `Sale ${sale.saleNumber} (Invoice ${sale.invoiceNumber}) cancelled${reason ? `: ${reason}` : ""}`,
    });

    return NextResponse.json({ sale: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
