import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { optionalGstinSchema, optionalPanSchema, optionalPinSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  businessName: z.string().trim().min(2),
  ownerName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  pin: optionalPinSchema,
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  gstin: optionalGstinSchema,
  pan: optionalPanSchema,
  logoUrl: z.string().trim().optional().nullable(),
  bankAccountName: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankIFSC: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  upiId: z.string().trim().optional(),
  invoicePrefix: z.string().trim().min(1).max(10),
  invoiceFormat: z.string().trim().min(3),
  financialYearStart: z.string().trim().regex(/^\d{2}-\d{2}$/),
  termsAndConditions: z.string().trim().optional(),
  markSetupCompleted: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireSession();
    const profile = await prisma.businessProfile.findFirst();
    return NextResponse.json({ profile });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER"]);
    const body = schema.parse(await req.json());

    const existing = await prisma.businessProfile.findFirst();
    const data = {
      ...body,
      email: body.email || undefined,
      setupCompleted: body.markSetupCompleted ? true : existing?.setupCompleted ?? false,
    };
    delete (data as { markSetupCompleted?: boolean }).markSetupCompleted;

    const profile = existing
      ? await prisma.businessProfile.update({ where: { id: existing.id }, data })
      : await prisma.businessProfile.create({ data });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? session.user.email ?? "Owner",
      action: existing ? "UPDATE" : "CREATE",
      entityType: "BusinessProfile",
      entityId: profile.id,
      description: `Business profile ${existing ? "updated" : "created"}`,
    });

    return NextResponse.json({ profile });
  } catch (err) {
    return handleApiError(err);
  }
}
