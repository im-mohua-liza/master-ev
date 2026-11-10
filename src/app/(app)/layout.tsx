import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessProfile } from "@/lib/business";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getBusinessProfile();
  if (!profile || !profile.setupCompleted) {
    redirect("/setup");
  }

  return (
    <AppShell
      businessName={profile.businessName}
      userName={session.user.name ?? "User"}
      userRole={session.user.role}
    >
      {children}
    </AppShell>
  );
}
