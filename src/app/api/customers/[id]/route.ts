import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { phoneSchema, optionalGstinSchema, optionalPanSchema, optionalPinSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(2),
  phone: phoneSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  pin: optionalPinSchema,
  gstin: optionalGstinSchema,
  pan: optionalPanSchema,
  idReference: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: { include: { vehicle: { include: { model: true } } }, orderBy: { createdAt: "desc" } },
        payments: { orderBy: { paymentDate: "desc" } },
        serviceRecords: { include: { vehicle: true }, orderBy: { serviceDate: "desc" } },
        leads: { orderBy: { createdAt: "desc" } },
        bookings: { include: { vehicle: { include: { model: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!customer) throw new ApiError(404, "Customer not found");
    return NextResponse.json({ customer });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES", "ACCOUNTANT"]);
    const { id } = await params;
    const body = schema.parse(await req.json());

    const customer = await prisma.customer.update({
      where: { id },
      data: { ...body, email: body.email || undefined },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "UPDATE",
      entityType: "Customer",
      entityId: customer.id,
      description: `Customer "${customer.name}" updated`,
    });

    return NextResponse.json({ customer });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER"]);
    const { id } = await params;

    const saleCount = await prisma.sale.count({ where: { customerId: id } });
    if (saleCount > 0) {
      throw new ApiError(400, "This customer has purchase history and cannot be deleted.");
    }

    const customer = await prisma.customer.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "Customer",
      entityId: id,
      description: `Customer "${customer.name}" deleted`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
