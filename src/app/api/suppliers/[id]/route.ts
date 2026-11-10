import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
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
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession(["OWNER", "MANAGER"]);
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        vehicles: { orderBy: { createdAt: "desc" }, include: { model: true } },
      },
    });
    if (!supplier) throw new ApiError(404, "Supplier not found");
    return NextResponse.json({ supplier });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const { id } = await params;
    const body = schema.parse(await req.json());

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { ...body, email: body.email || undefined },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "UPDATE",
      entityType: "Supplier",
      entityId: supplier.id,
      description: `Supplier "${supplier.companyName}" updated`,
    });

    return NextResponse.json({ supplier });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER"]);
    const { id } = await params;

    const vehicleCount = await prisma.vehicle.count({ where: { supplierId: id } });
    if (vehicleCount > 0) {
      // Preserve financial/history integrity — archive instead of delete.
      const supplier = await prisma.supplier.update({ where: { id }, data: { isActive: false } });
      await logAudit({
        userId: session.user.id,
        userName: session.user.name ?? "",
        action: "UPDATE",
        entityType: "Supplier",
        entityId: id,
        description: `Supplier "${supplier.companyName}" archived (has ${vehicleCount} linked vehicles)`,
      });
      return NextResponse.json({ archived: true });
    }

    const supplier = await prisma.supplier.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "Supplier",
      entityId: id,
      description: `Supplier "${supplier.companyName}" deleted`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
