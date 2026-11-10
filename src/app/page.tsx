import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export default async function RootPage() {
  const userCount = await prisma.user.count();
  if (userCount === 0) redirect("/bootstrap");

  const session = await auth();
  if (!session?.user) redirect("/login");

  redirect("/dashboard");
}
