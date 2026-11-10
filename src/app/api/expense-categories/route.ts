import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const categories = await prisma.expenseCategory.findMany({
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({ name: z.string().trim().min(2) });

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER"]);
    const { name } = schema.parse(await req.json());
    const category = await prisma.expenseCategory.create({ data: { name } });
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "ExpenseCategory",
      entityId: category.id,
      description: `Expense category "${category.name}" added`,
    });
    return NextResponse.json({ category });
  } catch (err) {
    return handleApiError(err);
  }
}
