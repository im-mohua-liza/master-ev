import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { getNextCode } from "@/lib/codes";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  date: z.string().optional(),
  categoryId: z.string().min(1, "Select a category"),
  description: z.string().trim().optional(),
  amount: z.coerce.number().positive("Enter a valid amount"),
  gst: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.string().trim().optional(),
  vendor: z.string().trim().optional(),
  receiptUrl: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession(["OWNER", "MANAGER", "ACCOUNTANT"]);
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const categoryId = sp.get("categoryId");
    const from = sp.get("from");
    const to = sp.get("to");

    const expenses = await prisma.expense.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
              },
            }
          : {}),
        ...(q ? { OR: [{ description: { contains: q } }, { vendor: { contains: q } }, { expenseCode: { contains: q } }] } : {}),
      },
      include: { category: true, recordedBy: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ expenses });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "ACCOUNTANT"]);
    const body = schema.parse(await req.json());

    const expense = await prisma.$transaction(async (tx) => {
      const expenseCode = await getNextCode("EXPENSE", tx);
      return tx.expense.create({
        data: {
          ...body,
          expenseCode,
          date: body.date ? new Date(body.date) : undefined,
          recordedById: session.user.id,
        },
      });
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "Expense",
      entityId: expense.id,
      description: `Expense ${expense.expenseCode} of ₹${expense.amount} recorded`,
    });

    return NextResponse.json({ expense });
  } catch (err) {
    return handleApiError(err);
  }
}
