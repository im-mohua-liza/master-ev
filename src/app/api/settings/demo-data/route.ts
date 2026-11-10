import { NextResponse } from "next/server";
import { requireSession, handleApiError } from "@/lib/api-guard";
import { seedDemoData, deleteDemoData } from "@/lib/demo-data";
import { logAudit } from "@/lib/audit";

export async function POST() {
  try {
    const session = await requireSession(["OWNER"]);
    await seedDemoData();
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "CREATE",
      entityType: "DemoData",
      description: "Sample/demo data loaded for exploration",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE() {
  try {
    const session = await requireSession(["OWNER"]);
    await deleteDemoData();
    await logAudit({
      userId: session.user.id,
      userName: session.user.name ?? "",
      action: "DELETE",
      entityType: "DemoData",
      description: "All demo/sample data removed",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
