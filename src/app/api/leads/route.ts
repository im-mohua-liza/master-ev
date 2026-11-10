import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { getNextCode } from "@/lib/codes";
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

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const status = sp.get("status");

    const leads = await prisma.lead.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : {}),
      },
      include: { interestedModel: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leads });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES"]);
    const body = schema.parse(await req.json());

    const lead = await prisma.$transaction(async (tx) => {
      const leadCode = await getNextCode("LEAD", tx);
      return tx.lead.create({
        data: {
          ...body,
          leadCode,
          interestedModelId: body.interestedModelId || undefined,
          assignedToId: body.assignedToId || session.user.id,
          followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
        },
      });
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "Lead",
      entityId: lead.id,
      description: `Lead "${lead.name}" added`,
    });

    return NextResponse.json({ lead });
  } catch (err) {
    return handleApiError(err);
  }
}
