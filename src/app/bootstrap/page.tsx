import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BootstrapForm } from "./bootstrap-form";

export default async function BootstrapPage() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl mb-4">
            ME
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to Master.EV</h1>
          <p className="text-slate-400 mt-1 text-sm">
            EV Showroom Management System — let&apos;s create your Owner account
          </p>
        </div>
        <div className="card p-6">
          <BootstrapForm />
        </div>
      </div>
    </div>
  );
}
