import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { phoneSchema } from "@/lib/validators";
import { ROLES } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: phoneSchema.optional(),
  password: z.string().min(8),
  role: z.enum(ROLES),
});

export async function GET() {
  try {
    await requireSession();
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["OWNER"]);
    const body = createSchema.parse(await req.json());

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        passwordHash,
        role: body.role,
      },
    });

    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      description: `Staff account "${user.name}" (${user.role}) created`,
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return handleApiError(err);
  }
}
