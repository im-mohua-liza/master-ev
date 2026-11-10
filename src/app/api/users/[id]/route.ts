import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { phoneSchema } from "@/lib/validators";
import { ROLES } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().trim().min(2),
  phone: phoneSchema.optional(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
  newPassword: z.string().min(8).optional().or(z.literal("")),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER"]);
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    if (id === session.user.id && body.role !== "OWNER") {
      throw new ApiError(400, "You cannot change your own Owner role.");
    }
    if (id === session.user.id && !body.isActive) {
      throw new ApiError(400, "You cannot deactivate your own account.");
    }

    const data: { name: string; phone?: string; role: string; isActive: boolean; passwordHash?: string } = {
      name: body.name,
      phone: body.phone,
      role: body.role,
      isActive: body.isActive,
    };
    if (body.newPassword) {
      data.passwordHash = await bcrypt.hash(body.newPassword, 12);
    }

    const user = await prisma.user.update({ where: { id }, data });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "UPDATE",
      entityType: "User",
      entityId: user.id,
      description: `Staff account "${user.name}" updated (role: ${user.role}, active: ${user.isActive})`,
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role, isActive: user.isActive } });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER"]);
    const { id } = await params;

    if (id === session.user.id) {
      throw new ApiError(400, "You cannot delete your own account.");
    }

    const [sales, leads, testRides, payments, expenses, service] = await Promise.all([
      prisma.sale.count({ where: { salespersonId: id } }),
      prisma.lead.count({ where: { assignedToId: id } }),
      prisma.testRide.count({ where: { salespersonId: id } }),
      prisma.payment.count({ where: { recordedById: id } }),
      prisma.expense.count({ where: { recordedById: id } }),
      prisma.serviceRecord.count({ where: { technicianId: id } }),
    ]);
    const linked = sales + leads + testRides + payments + expenses + service;

    if (linked > 0) {
      const user = await prisma.user.update({ where: { id }, data: { isActive: false } });
      await logAudit({
        userId: session.user.id,
        userName: session.user.name ?? "",
        action: "UPDATE",
        entityType: "User",
        entityId: id,
        description: `Staff account "${user.name}" deactivated (has ${linked} linked records, cannot be deleted)`,
      });
      return NextResponse.json({ deactivated: true });
    }

    const user = await prisma.user.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "User",
      entityId: id,
      description: `Staff account "${user.name}" deleted`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
