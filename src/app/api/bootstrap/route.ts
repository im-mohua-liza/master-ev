import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { phoneSchema } from "@/lib/validators";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/default-expense-categories";
import { handleApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: phoneSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const existing = await prisma.user.count();
    if (existing > 0) {
      return NextResponse.json(
        { error: "Setup has already been completed. Please log in." },
        { status: 403 }
      );
    }

    const body = schema.parse(await req.json());
    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: body.name,
          email: body.email.toLowerCase(),
          phone: body.phone,
          passwordHash,
          role: "OWNER",
        },
      });

      await tx.businessProfile.create({
        data: { businessName: "Master.EV", email: body.email.toLowerCase(), phone: body.phone },
      });

      for (const name of DEFAULT_EXPENSE_CATEGORIES) {
        await tx.expenseCategory.upsert({
          where: { name },
          update: {},
          create: { name, isDefault: true },
        });
      }

      return created;
    });

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      description: `Owner account created for ${user.email}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
