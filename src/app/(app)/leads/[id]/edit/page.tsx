import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/data-table-shell";
import { LeadForm } from "@/components/lead-form";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit Lead: ${lead.name}`} />
      <LeadForm
        leadId={lead.id}
        initial={{
          name: lead.name,
          phone: lead.phone,
          interestedModelId: lead.interestedModelId ?? "",
          budget: lead.budget?.toString() ?? "",
          source: lead.source ?? "Walk-in",
          assignedToId: lead.assignedToId ?? "",
          followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().slice(0, 10) : "",
          status: lead.status,
          notes: lead.notes ?? "",
        }}
      />
    </div>
  );
}
