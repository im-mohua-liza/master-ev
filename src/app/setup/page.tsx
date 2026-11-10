import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBusinessProfile } from "@/lib/business";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await getBusinessProfile();
  if (profile?.setupCompleted) redirect("/dashboard");

  if (session.user.role !== "OWNER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold text-slate-900">Setup pending</h1>
          <p className="mt-2 text-sm text-slate-600">
            The Owner account needs to complete the initial business setup before the
            showroom system can be used. Please ask the Owner to log in and finish
            setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl mb-4">
            ME
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Master.EV</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Let&apos;s set up your business profile. You can change all of this later from
            Settings → Business Profile.
          </p>
        </div>
        <div className="card p-6 lg:p-8">
          <SetupForm initial={profile} />
        </div>
      </div>
    </div>
  );
}
