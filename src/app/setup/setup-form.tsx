"use client";

import { BusinessProfileForm, type BusinessProfileData } from "@/components/business-profile-form";

export function SetupForm({ initial }: { initial: Partial<BusinessProfileData> | null }) {
  return <BusinessProfileForm initial={initial} mode="setup" />;
}
