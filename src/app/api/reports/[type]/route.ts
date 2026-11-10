import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-guard";
import { toCsvResponse } from "@/lib/csv";

function dateFilter(req: NextRequest, field = "createdAt") {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from && !to) return {};
  return {
    [field]: {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
    },
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    await requireSession(["OWNER", "MANAGER", "ACCOUNTANT"]);
    const { type } = await params;

    switch (type) {
      case "sales": {
        const sales = await prisma.sale.findMany({
          where: { ...dateFilter(req, "saleDate") },
          include: { customer: true, vehicle: { include: { model: true } }, salesperson: true },
          orderBy: { saleDate: "desc" },
        });
        return toCsvResponse(
          "sales-report.csv",
          sales.map((s) => ({
            "Invoice No": s.invoiceNumber ?? s.saleNumber,
            Date: s.saleDate.toISOString().slice(0, 10),
            Customer: s.customer.name,
            Phone: s.customer.phone,
            Vehicle: `${s.vehicle.model.brand} ${s.vehicle.model.model}`,
            "Chassis No": s.vehicle.chassisNumber,
            "Base Price": s.basePrice,
            Discount: s.discount,
            "Taxable Value": s.taxableValue,
            GST: s.totalGst,
            "Grand Total": s.grandTotal,
            "Amount Paid": s.amountPaid,
            Balance: s.balanceAmount,
            "Payment Status": s.paymentStatus,
            Status: s.status,
            Salesperson: s.salesperson?.name ?? "",
          }))
        );
      }
      case "inventory": {
        const vehicles = await prisma.vehicle.findMany({
          include: { model: true, supplier: true },
          orderBy: { createdAt: "desc" },
        });
        return toCsvResponse(
          "inventory-report.csv",
          vehicles.map((v) => ({
            "Vehicle Code": v.vehicleCode,
            Brand: v.model.brand,
            Model: v.model.model,
            Variant: v.model.variant ?? "",
            Colour: v.colour ?? "",
            "Chassis No": v.chassisNumber,
            "Motor No": v.motorNumber,
            "Battery No": v.batteryNumber,
            "Purchase Price": v.purchasePrice,
            "Selling Price": v.sellingPrice,
            Status: v.status,
            Supplier: v.supplier?.companyName ?? "",
            "Purchase Date": v.purchaseDate ? v.purchaseDate.toISOString().slice(0, 10) : "",
          }))
        );
      }
      case "customers": {
        const customers = await prisma.customer.findMany({
          include: { sales: true },
          orderBy: { createdAt: "desc" },
        });
        return toCsvResponse(
          "customer-report.csv",
          customers.map((c) => ({
            "Customer Code": c.customerCode,
            Name: c.name,
            Phone: c.phone,
            Email: c.email ?? "",
            City: c.city ?? "",
            "Total Purchases": c.sales.filter((s) => s.status !== "CANCELLED").length,
            "Total Value": c.sales.filter((s) => s.status !== "CANCELLED").reduce((sum, s) => sum + s.grandTotal, 0),
            "Total Due": c.sales.filter((s) => s.status !== "CANCELLED").reduce((sum, s) => sum + s.balanceAmount, 0),
          }))
        );
      }
      case "expenses": {
        const expenses = await prisma.expense.findMany({
          where: { ...dateFilter(req, "date") },
          include: { category: true },
          orderBy: { date: "desc" },
        });
        return toCsvResponse(
          "expense-report.csv",
          expenses.map((e) => ({
            "Expense Code": e.expenseCode,
            Date: e.date.toISOString().slice(0, 10),
            Category: e.category.name,
            Description: e.description ?? "",
            Vendor: e.vendor ?? "",
            Amount: e.amount,
            "Payment Method": e.paymentMethod ?? "",
          }))
        );
      }
      case "payments": {
        const payments = await prisma.payment.findMany({
          where: { ...dateFilter(req, "paymentDate") },
          include: { customer: true, sale: true },
          orderBy: { paymentDate: "desc" },
        });
        return toCsvResponse(
          "payment-report.csv",
          payments.map((p) => ({
            "Payment Code": p.paymentCode,
            Date: p.paymentDate.toISOString().slice(0, 10),
            Customer: p.customer.name,
            Invoice: p.sale?.invoiceNumber ?? p.sale?.saleNumber ?? "",
            Amount: p.amount,
            Method: p.method,
            Reference: p.referenceNumber ?? "",
          }))
        );
      }
      case "outstanding": {
        const sales = await prisma.sale.findMany({
          where: { status: { not: "CANCELLED" }, balanceAmount: { gt: 0 } },
          include: { customer: true },
          orderBy: { saleDate: "asc" },
        });
        return toCsvResponse(
          "outstanding-report.csv",
          sales.map((s) => ({
            "Invoice No": s.invoiceNumber ?? s.saleNumber,
            Date: s.saleDate.toISOString().slice(0, 10),
            Customer: s.customer.name,
            Phone: s.customer.phone,
            "Grand Total": s.grandTotal,
            "Amount Paid": s.amountPaid,
            "Balance Due": s.balanceAmount,
          }))
        );
      }
      case "gst": {
        const sales = await prisma.sale.findMany({
          where: { status: { not: "CANCELLED" }, ...dateFilter(req, "saleDate") },
          include: { customer: true, vehicle: { include: { model: true } } },
          orderBy: { saleDate: "desc" },
        });
        return toCsvResponse(
          "gst-report.csv",
          sales.map((s) => ({
            "Invoice No": s.invoiceNumber ?? s.saleNumber,
            Date: s.saleDate.toISOString().slice(0, 10),
            Customer: s.customer.name,
            "GSTIN": s.customer.gstin ?? "",
            "Taxable Value": s.taxableValue,
            "GST Rate %": s.gstRate,
            CGST: s.cgst,
            SGST: s.sgst,
            IGST: s.igst,
            "Total GST": s.totalGst,
            "Grand Total": s.grandTotal,
          }))
        );
      }
      case "service": {
        const records = await prisma.serviceRecord.findMany({
          where: { ...dateFilter(req, "serviceDate") },
          include: { vehicle: true, customer: true },
          orderBy: { serviceDate: "desc" },
        });
        return toCsvResponse(
          "service-report.csv",
          records.map((r) => ({
            "Service Code": r.serviceCode,
            Date: r.serviceDate.toISOString().slice(0, 10),
            Vehicle: r.vehicle.vehicleCode,
            Customer: r.customer?.name ?? "",
            "Service Type": r.serviceType ?? "",
            "Labour Charge": r.labourCharge,
            "Parts Cost": r.partsCost,
            "Total Cost": r.totalCost,
          }))
        );
      }
      case "leads": {
        const leads = await prisma.lead.findMany({
          include: { interestedModel: true, assignedTo: true },
          orderBy: { createdAt: "desc" },
        });
        return toCsvResponse(
          "lead-conversion-report.csv",
          leads.map((l) => ({
            "Lead Code": l.leadCode,
            Name: l.name,
            Phone: l.phone,
            "Interested Model": l.interestedModel ? `${l.interestedModel.brand} ${l.interestedModel.model}` : "",
            Source: l.source ?? "",
            Status: l.status,
            "Assigned To": l.assignedTo?.name ?? "",
          }))
        );
      }
      default:
        throw new ApiError(404, "Unknown report type");
    }
  } catch (err) {
    return handleApiError(err);
  }
}
