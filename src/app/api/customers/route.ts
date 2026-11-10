import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { getNextCode } from "@/lib/codes";
import { phoneSchema, optionalGstinSchema, optionalPanSchema, optionalPinSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
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

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
              { customerCode: { contains: q } },
            ],
          }
        : undefined,
      include: { _count: { select: { sales: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customers });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES", "ACCOUNTANT"]);
    const body = schema.parse(await req.json());

    const customer = await prisma.$transaction(async (tx) => {
      const customerCode = await getNextCode("CUSTOMER", tx);
      return tx.customer.create({ data: { ...body, customerCode, email: body.email || undefined } });
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "Customer",
      entityId: customer.id,
      description: `Customer "${customer.name}" added`,
    });

    return NextResponse.json({ customer });
  } catch (err) {
    return handleApiError(err);
  }
}
