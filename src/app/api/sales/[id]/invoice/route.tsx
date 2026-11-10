import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { InvoiceDocument } from "@/lib/invoice-pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;

    const [sale, business] = await Promise.all([
      prisma.sale.findUnique({
        where: { id },
        include: { customer: true, vehicle: { include: { model: true } } },
      }),
      prisma.businessProfile.findFirst(),
    ]);

    if (!sale) throw new ApiError(404, "Sale not found");
    if (!business) throw new ApiError(400, "Business profile not configured");

    const buffer = await renderToBuffer(
      <InvoiceDocument
        data={{
          business,
          sale,
          customer: sale.customer,
          vehicle: sale.vehicle,
        }}
      />
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Invoice-${sale.invoiceNumber ?? sale.saleNumber}.pdf"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
