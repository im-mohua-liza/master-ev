import { prisma } from "./prisma";

export async function logAudit(params: {
  userId?: string | null;
  userName: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "CANCEL" | "LOGIN" | "LOGOUT";
  entityType: string;
  entityId?: string | null;
  description: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      userName: params.userName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      description: params.description,
    },
  });
}
