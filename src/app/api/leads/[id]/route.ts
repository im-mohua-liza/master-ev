import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

const LEAD_STATUSES = ["NEW", "CONTACTED", "INTERESTED", "TEST_RIDE", "NEGOTIATION", "BOOKED", "SOLD", "LOST"] as const;

const schema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(10),
  interestedModelId: z.string().trim().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  source: z.string().trim().optional(),
  assignedToId: z.string().trim().optional(),
  followUpDate: z.string().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().trim().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { interestedModel: true, assignedTo: true, testRides: true, customer: true },
    });
    if (!lead) throw new ApiError(404, "Lead not found");
    return NextResponse.json({ lead });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES"]);
    const { id } = await params;
    const body = schema.parse(await req.json());

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...body,
        interestedModelId: body.interestedModelId || null,
        assignedToId: body.assignedToId || null,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "UPDATE",
      entityType: "Lead",
      entityId: lead.id,
      description: `Lead "${lead.name}" updated (status: ${lead.status})`,
    });

    return NextResponse.json({ lead });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const { id } = await params;
    const lead = await prisma.lead.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "Lead",
      entityId: id,
      description: `Lead "${lead.name}" deleted`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
