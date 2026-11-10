import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Role } from "./roles";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Ensures a request is authenticated and (optionally) has one of the allowed roles. */
export async function requireSession(allowed?: Role[]) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError(401, "Not authenticated");
  }
  if (allowed && !allowed.includes(session.user.role as Role)) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
  return session;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message =
    typeof err === "object" && err && "message" in err
      ? String((err as { message?: unknown }).message)
      : "Something went wrong";

  // Prisma unique constraint violation
  if (typeof err === "object" && err && "code" in err && (err as { code?: string }).code === "P2002") {
    const target = (err as { meta?: { target?: string[] } }).meta?.target?.join(", ");
    return NextResponse.json(
      { error: `A record with this ${target ?? "value"} already exists.` },
      { status: 409 }
    );
  }

  console.error(err);
  return NextResponse.json({ error: message }, { status: 400 });
}
