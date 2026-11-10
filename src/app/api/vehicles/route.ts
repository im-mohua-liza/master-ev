import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { getNextCode } from "@/lib/codes";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  modelId: z.string().min(1, "Select a scooter model"),
  colour: z.string().trim().optional(),
  batteryType: z.string().trim().optional(),
  batteryCapacity: z.string().trim().optional(),
  motorPower: z.string().trim().optional(),
  range: z.string().trim().optional(),
  topSpeed: z.string().trim().optional(),
  exShowroomPrice: z.coerce.number().nonnegative().optional(),
  sellingPrice: z.coerce.number().positive("Selling price is required"),
  purchasePrice: z.coerce.number().positive("Purchase price is required"),
  dealerPrice: z.coerce.number().nonnegative().optional(),
  gstRate: z.coerce.number().min(0).max(28),
  chassisNumber: z.string().trim().min(3, "Chassis number is required"),
  motorNumber: z.string().trim().min(3, "Motor number is required"),
  batteryNumber: z.string().trim().min(3, "Battery number is required"),
  manufacturingDate: z.string().optional(),
  purchaseDate: z.string().optional(),
  supplierId: z.string().trim().optional(),
  location: z.string().trim().optional(),
  warrantyMonths: z.coerce.number().int().nonnegative().optional(),
  batteryWarrantyMonths: z.coerce.number().int().nonnegative().optional(),
  photoUrl: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const status = sp.get("status");
    const modelId = sp.get("modelId");
    const availableOnly = sp.get("availableOnly") === "1";

    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(availableOnly ? { status: { in: ["IN_STOCK", "RESERVED"] } } : {}),
        ...(modelId ? { modelId } : {}),
        ...(q
          ? {
              OR: [
                { vehicleCode: { contains: q } },
                { chassisNumber: { contains: q } },
                { motorNumber: { contains: q } },
                { batteryNumber: { contains: q } },
                { colour: { contains: q } },
                { model: { brand: { contains: q } } },
                { model: { model: { contains: q } } },
              ],
            }
          : {}),
      },
      include: { model: true, supplier: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ vehicles });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER", "MANAGER"]);
    const body = schema.parse(await req.json());

    const vehicle = await prisma.$transaction(async (tx) => {
      const vehicleCode = await getNextCode("VEHICLE", tx);
      return tx.vehicle.create({
        data: {
          ...body,
          vehicleCode,
          manufacturingDate: body.manufacturingDate ? new Date(body.manufacturingDate) : undefined,
          purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
          supplierId: body.supplierId || undefined,
        },
      });
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "Vehicle",
      entityId: vehicle.id,
      description: `Scooter ${vehicle.vehicleCode} (chassis ${vehicle.chassisNumber}) added to inventory`,
    });

    return NextResponse.json({ vehicle });
  } catch (err) {
    return handleApiError(err);
  }
}
