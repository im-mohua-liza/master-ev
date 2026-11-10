import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  date: z.string().optional(),
  categoryId: z.string().min(1),
  description: z.string().trim().optional(),
  amount: z.coerce.number().positive(),
  gst: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.string().trim().optional(),
  vendor: z.string().trim().optional(),
  receiptUrl: z.string().trim().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "ACCOUNTANT"]);
    const { id } = await params;
    const body = schema.parse(await req.json());

    const expense = await prisma.expense.update({
      where: { id },
      data: { ...body, date: body.date ? new Date(body.date) : undefined },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "UPDATE",
      entityType: "Expense",
      entityId: expense.id,
      description: `Expense ${expense.expenseCode} updated`,
    });

    return NextResponse.json({ expense });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const { id } = await params;
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new ApiError(404, "Expense not found");

    await prisma.expense.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "Expense",
      entityId: id,
      description: `Expense ${expense.expenseCode} (₹${expense.amount}) deleted`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
