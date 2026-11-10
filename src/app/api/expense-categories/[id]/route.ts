import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(["OWNER"]);
    const { id } = await params;

    const usageCount = await prisma.expense.count({ where: { categoryId: id } });
    if (usageCount > 0) {
      throw new ApiError(400, "This category has expenses recorded against it and cannot be deleted.");
    }

    const category = await prisma.expenseCategory.delete({ where: { id } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "ExpenseCategory",
      entityId: id,
      description: `Expense category "${category.name}" deleted`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
