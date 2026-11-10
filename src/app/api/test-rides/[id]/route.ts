import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  customerName: z.string().trim().min(2),
  phone: z.string().trim().min(10),
  modelId: z.string().min(1),
  vehicleNumber: z.string().trim().optional(),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().trim().optional(),
  salespersonId: z.string().trim().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
  feedback: z.string().trim().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES"]);
    const { id } = await params;
    const body = schema.parse(await req.json());

    const testRide = await prisma.testRide.update({
      where: { id },
      data: {
        ...body,
        salespersonId: body.salespersonId || null,
        scheduledDate: new Date(body.scheduledDate),
      },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "UPDATE",
      entityType: "TestRide",
      entityId: testRide.id,
      description: `Test ride for "${testRide.customerName}" updated (${testRide.status})`,
    });

    return NextResponse.json({ testRide });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const { id } = await params;
    const testRide = await prisma.testRide.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "TestRide",
      entityId: id,
      description: `Test ride for "${testRide.customerName}" deleted`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
