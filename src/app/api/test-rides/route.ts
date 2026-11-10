import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  customerName: z.string().trim().min(2),
  phone: z.string().trim().min(10),
  customerId: z.string().trim().optional(),
  leadId: z.string().trim().optional(),
  modelId: z.string().min(1, "Select a model"),
  vehicleNumber: z.string().trim().optional(),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().trim().optional(),
  salespersonId: z.string().trim().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  feedback: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const status = sp.get("status");
    const today = sp.get("today") === "1";

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const testRides = await prisma.testRide.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(today ? { scheduledDate: { gte: startOfToday, lte: endOfToday } } : {}),
        ...(q ? { OR: [{ customerName: { contains: q } }, { phone: { contains: q } }] } : {}),
      },
      include: { model: true, salesperson: true },
      orderBy: { scheduledDate: "desc" },
    });

    return NextResponse.json({ testRides });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES"]);
    const body = schema.parse(await req.json());

    const testRide = await prisma.testRide.create({
      data: {
        ...body,
        customerId: body.customerId || undefined,
        leadId: body.leadId || undefined,
        salespersonId: body.salespersonId || session.user.id,
        scheduledDate: new Date(body.scheduledDate),
      },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "TestRide",
      entityId: testRide.id,
      description: `Test ride scheduled for "${testRide.customerName}"`,
    });

    return NextResponse.json({ testRide });
  } catch (err) {
    return handleApiError(err);
  }
}
