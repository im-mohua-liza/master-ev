import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { getNextCode } from "@/lib/codes";
import { round2 } from "@/lib/money";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  saleId: z.string().trim().optional(),
  amount: z.coerce.number().positive("Enter a valid amount"),
  method: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "FINANCE", "CHEQUE", "OTHER"]),
  paymentDate: z.string().optional(),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession(["OWNER", "MANAGER", "SALES", "ACCOUNTANT"]);
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const method = sp.get("method");
    const from = sp.get("from");
    const to = sp.get("to");

    const payments = await prisma.payment.findMany({
      where: {
        ...(method ? { method } : {}),
        ...(from || to
          ? {
              paymentDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { paymentCode: { contains: q } },
                { referenceNumber: { contains: q } },
                { customer: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { customer: true, sale: true, recordedBy: true },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES", "ACCOUNTANT"]);
    const body = schema.parse(await req.json());

    const payment = await prisma.$transaction(async (tx) => {
      if (body.saleId) {
        const sale = await tx.sale.findUnique({ where: { id: body.saleId } });
        if (!sale) throw new ApiError(404, "Sale not found");
        if (sale.status === "CANCELLED") throw new ApiError(400, "Cannot record payment against a cancelled sale.");
        if (body.amount > sale.balanceAmount + 0.01) {
          throw new ApiError(400, `Amount exceeds the outstanding balance of ₹${sale.balanceAmount.toFixed(2)}`);
        }

        const newAmountPaid = round2(sale.amountPaid + body.amount);
        const newBalance = round2(Math.max(0, sale.grandTotal - sale.exchangeValue - newAmountPaid));
        const paymentStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

        await tx.sale.update({
          where: { id: sale.id },
          data: { amountPaid: newAmountPaid, balanceAmount: newBalance, paymentStatus },
        });
      }

      const paymentCode = await getNextCode("PAYMENT", tx);
      return tx.payment.create({
        data: {
          paymentCode,
          customerId: body.customerId,
          saleId: body.saleId || undefined,
          amount: body.amount,
          method: body.method,
          paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
          referenceNumber: body.referenceNumber,
          notes: body.notes,
          recordedById: session.user.id,
        },
      });
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "Payment",
      entityId: payment.id,
      description: `Payment ${payment.paymentCode} of ₹${payment.amount} recorded`,
    });

    return NextResponse.json({ payment });
  } catch (err) {
    return handleApiError(err);
  }
}
