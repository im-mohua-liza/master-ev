import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { getNextCode, getNextInvoiceNumber } from "@/lib/codes";
import { calculateSale } from "@/lib/sale-calc";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  vehicleId: z.string().min(1, "Select a vehicle"),
  bookingId: z.string().trim().optional(),
  discount: z.coerce.number().nonnegative().default(0),
  exchangeValue: z.coerce.number().nonnegative().default(0),
  exchangeDetails: z.string().trim().optional(),
  gstType: z.enum(["INTRA", "INTER"]).default("INTRA"),
  amountPaidNow: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "FINANCE", "CHEQUE", "OTHER"]).default("CASH"),
  salespersonId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const paymentStatus = sp.get("paymentStatus");
    const status = sp.get("status");

    const sales = await prisma.sale.findMany({
      where: {
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(status ? { status } : { status: { not: "CANCELLED" } }),
        ...(q
          ? {
              OR: [
                { saleNumber: { contains: q } },
                { invoiceNumber: { contains: q } },
                { customer: { name: { contains: q } } },
                { vehicle: { chassisNumber: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { customer: true, vehicle: { include: { model: true } }, salesperson: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sales });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER", "SALES"]);
    const body = schema.parse(await req.json());

    const [vehicle, customer, booking] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: body.vehicleId } }),
      prisma.customer.findUnique({ where: { id: body.customerId } }),
      body.bookingId ? prisma.booking.findUnique({ where: { id: body.bookingId } }) : Promise.resolve(null),
    ]);

    if (!vehicle) throw new ApiError(404, "Vehicle not found");
    if (!customer) throw new ApiError(404, "Customer not found");
    if (!["IN_STOCK", "RESERVED"].includes(vehicle.status)) {
      throw new ApiError(400, `This vehicle is ${vehicle.status.replaceAll("_", " ")} and cannot be sold.`);
    }
    if (body.bookingId && (!booking || booking.status === "CONVERTED" || booking.status === "CANCELLED")) {
      throw new ApiError(400, "This booking is not available to convert.");
    }

    const carriedForward = booking?.bookingAmount ?? 0;
    const calc = calculateSale({
      basePrice: vehicle.sellingPrice,
      discount: body.discount,
      exchangeValue: body.exchangeValue,
      gstRate: vehicle.gstRate,
      amountPaid: carriedForward + body.amountPaidNow,
      gstType: body.gstType,
    });

    const sale = await prisma.$transaction(async (tx) => {
      const saleNumber = await getNextCode("SALE", tx);
      const invoiceNumber = await getNextInvoiceNumber(tx);

      const created = await tx.sale.create({
        data: {
          saleNumber,
          invoiceNumber,
          customerId: body.customerId,
          vehicleId: body.vehicleId,
          salespersonId: body.salespersonId || session.user.id,
          basePrice: calc.basePrice,
          discount: calc.discount,
          exchangeValue: calc.exchangeValue,
          taxableValue: calc.taxableValue,
          gstRate: calc.gstRate,
          cgst: calc.cgst,
          sgst: calc.sgst,
          igst: calc.igst,
          totalGst: calc.totalGst,
          grandTotal: calc.grandTotal,
          amountPaid: calc.amountPaid,
          balanceAmount: calc.balanceAmount,
          paymentStatus: calc.paymentStatus,
          notes: [body.notes, body.exchangeDetails ? `Exchange vehicle: ${body.exchangeDetails}` : null]
            .filter(Boolean)
            .join(" | ") || undefined,
        },
      });

      await tx.vehicle.update({ where: { id: body.vehicleId }, data: { status: "SOLD" } });

      if (body.amountPaidNow > 0) {
        const paymentCode = await getNextCode("PAYMENT", tx);
        await tx.payment.create({
          data: {
            paymentCode,
            saleId: created.id,
            customerId: body.customerId,
            amount: body.amountPaidNow,
            method: body.paymentMethod,
            notes: `Payment at sale ${saleNumber}`,
            recordedById: session.user.id,
          },
        });
      }

      if (booking) {
        await tx.booking.update({ where: { id: booking.id }, data: { status: "CONVERTED", saleId: created.id } });
      }

      return created;
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "Sale",
      entityId: sale.id,
      description: `Sale ${sale.saleNumber} (Invoice ${sale.invoiceNumber}) created for vehicle ${vehicle.vehicleCode}, total ${calc.grandTotal}`,
    });

    return NextResponse.json({ sale });
  } catch (err) {
    return handleApiError(err);
  }
}
